import "server-only";
import type { Connection, User } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { HttpError } from "@/lib/route";
import { endEarly, runForMember } from "./runs";

export async function listConnections(user: User): Promise<Connection[]> {
  return query<Connection>(
    `select u.id as user_id, u.display_name, u.avatar_url from connections c
     join users u on u.id = case when c.user_a = $1 then c.user_b else c.user_a end
     where $1 in (c.user_a, c.user_b) order by c.created_at desc`,
    [user.id],
  );
}

// Staying in touch needs both people. Your yes is kept on the run, and nothing
// is shared with anyone until the other person says yes too.
export async function stayInTouch(user: User, runId: string) {
  const run = await runForMember(user, runId);
  if (run.mode !== "pair") throw new HttpError(400, "this only works for quests with someone new");
  return transaction(async () => {
    // Locks the run, so two people saying yes at once still see each other's yes.
    await query("select id from quest_runs where id = $1 for update", [runId]);
    await query("update run_members set stay_in_touch_at = coalesce(stay_in_touch_at, now()) where run_id = $1 and user_id = $2", [runId, user.id]);
    const other = await one<{ user_id: string; stay_in_touch_at: Date | null; is_bot: boolean }>(
      `select m.user_id, m.stay_in_touch_at, u.is_bot from run_members m join users u on u.id = m.user_id
       where m.run_id = $1 and m.user_id <> $2`,
      [runId, user.id],
    );
    if (!other || (!other.stay_in_touch_at && !other.is_bot)) return { connected: false };
    const [a, b] = [user.id, other.user_id].sort();
    await query("insert into connections (user_a, user_b, run_id) values ($1, $2, $3) on conflict do nothing", [a, b, runId]);
    return { connected: true };
  });
}

// Leaving without blaming anyone: ends a quest with someone new for both of you,
// the same way a report does, but nothing is reported and you can be matched
// again. Crew and solo quests just run out on their own.
export async function leaveRun(user: User, runId: string) {
  const run = await runForMember(user, runId);
  if (run.mode === "pair" && run.status === "active") await endEarly(run.id);
}

// A report ends the quest straight away and the two of you are never paired again.
export async function report(user: User, body: { reported_id?: string; run_id?: string; reason?: string }) {
  if (!body.reported_id || !body.run_id || !body.reason?.trim()) throw new HttpError(400, "reported_id, run_id and reason are required");
  const run = await runForMember(user, body.run_id);
  const member = await one("select 1 as yes from run_members where run_id = $1 and user_id = $2", [body.run_id, body.reported_id]);
  if (!member) throw new HttpError(400, "that person wasn't on this quest");
  await transaction(async () => {
    await query(
      "insert into reports (reporter_id, reported_id, run_id, reason) values ($1, $2, $3, $4)",
      [user.id, body.reported_id, body.run_id, body.reason!.trim().slice(0, 500)],
    );
    if (run.mode === "pair" && run.status === "active") await endEarly(run.id);
  });
}
