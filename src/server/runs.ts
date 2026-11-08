import "server-only";
import type { Checkin, Quest, QuestRun, RunMember, User, Verdict } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { DEMO_MODE } from "@/lib/env";
import { HttpError, notFound } from "@/lib/route";
import { awardCoins } from "./coins";
import { getQuest, type QuestRow, toQuest } from "./quests";
import { distanceM } from "./safety";

// Proof can still land for a short while after the timer ends, because a phone
// outdoors might have been out of signal.
const GRACE_MS = 2 * 60_000;
const BOT_SUBMIT_MS = 6000;
// If a check never comes back (a restart, a hung call), don't strand anyone.
export const STUCK_VERDICT_MS = DEMO_MODE ? 20_000 : 45_000;

export type RunRow = {
  id: string;
  quest_id: string;
  match_id: string | null;
  crew_id: string | null;
  zone_id: string | null;
  team_id: string | null;
  mode: QuestRun["mode"];
  status: QuestRun["status"];
  started_at: Date;
  ends_at: Date;
  completed_at: Date | null;
};

type MemberRow = {
  user_id: string;
  display_name: string;
  is_bot: boolean;
  verdict: Verdict["status"] | null;
  reason: string | null;
  approved_at: Date | null;
  hint: string | null;
};

// What Priya says when someone asks how to spot her.
const BOT_HINT = "Blue jacket, waiting by the main doors.";
export const HINT_MAX = 80;

export async function createRun(input: {
  quest: Quest;
  mode: QuestRun["mode"];
  members: string[];
  matchId?: string;
  crewId?: string | null;
  zoneId?: string | null;
  teamId?: string | null;
}) {
  const ends = new Date(Date.now() + input.quest.duration_min * 60_000);
  const run = await one<RunRow>(
    `insert into quest_runs (quest_id, match_id, crew_id, zone_id, team_id, mode, ends_at)
     values ($1, $2, $3, $4, $5, $6, $7::timestamptz) returning *`,
    [input.quest.id, input.matchId ?? null, input.crewId ?? null, input.zoneId ?? null, input.teamId ?? null, input.mode, ends.toISOString()],
  );
  for (const member of input.members) {
    await query("insert into run_members (run_id, user_id) values ($1, $2) on conflict do nothing", [run!.id, member]);
  }
  return run!;
}

const members = (runId: string) =>
  query<MemberRow>(
    `select m.user_id, u.display_name, u.is_bot, m.hint, latest.verdict, latest.reason, approved.created_at as approved_at
     from run_members m
     join users u on u.id = m.user_id
     left join lateral (
       select s.verdict, s.reason from submissions s
       where s.run_id = m.run_id and s.user_id = m.user_id order by s.created_at desc limit 1
     ) latest on true
     left join lateral (
       select s.created_at from submissions s
       where s.run_id = m.run_id and s.user_id = m.user_id and s.verdict = 'approved' order by s.created_at limit 1
     ) approved on true
     where m.run_id = $1
     order by m.joined_at, m.user_id`,
    [runId],
  );

export const loadRun = (id: string) => one<RunRow>("select * from quest_runs where id = $1", [id]);

// "How to spot me", only on an active quest with someone new.
export async function setHint(user: User, runId: string, hint: string) {
  const run = await runForMember(user, runId);
  if (run.mode !== "pair" || run.status !== "active") throw new HttpError(409, "this quest isn't on any more.");
  const clean = hint.replace(/\s+/g, " ").trim().slice(0, HINT_MAX);
  await query("update run_members set hint = $3 where run_id = $1 and user_id = $2", [runId, user.id, clean || null]);
}

export async function runForMember(user: User, id: string) {
  const run = await loadRun(id);
  if (!run) throw notFound("run");
  const member = await one("select 1 as yes from run_members where run_id = $1 and user_id = $2", [id, user.id]);
  if (!member) throw notFound("run");
  return run;
}

// The caller always comes first: the quest and proof screens read members[0]
// as "you". `submitted` means your proof was approved; while it's being checked
// the verdict is pending.
export async function toRun(run: RunRow, viewerId: string): Promise<QuestRun> {
  const [quest, rows] = await Promise.all([getQuest(run.quest_id), members(run.id)]);
  const list: RunMember[] = rows.map((m) => ({
    user_id: m.user_id,
    display_name: m.display_name,
    hint: run.mode === "pair" ? (m.hint ?? (m.is_bot ? BOT_HINT : null)) : null,
    submitted: !!m.approved_at,
    verdict: m.verdict
      ? { status: m.verdict, reason: m.reason ?? "", ...(m.verdict === "approved" ? { coins: quest.coins } : {}) }
      : null,
  }));
  list.sort((a, b) => Number(b.user_id === viewerId) - Number(a.user_id === viewerId));
  return {
    id: run.id,
    quest,
    mode: run.mode,
    status: run.status,
    started_at: run.started_at.toISOString(),
    ends_at: run.ends_at.toISOString(),
    members: list,
    zone_id: run.zone_id,
    crew_id: run.crew_id,
  };
}

export async function getRun(user: User, id: string) {
  const run = await runForMember(user, id);
  return toRun(await advance(run), user.id);
}

// The quest you're on right now, so nobody gets stranded after a reload.
export async function currentRun(user: User): Promise<QuestRun | null> {
  const run = await one<RunRow>(
    `select r.* from quest_runs r join run_members m on m.run_id = r.id
     where m.user_id = $1 and r.status = 'active'
     order by r.started_at desc limit 1`,
    [user.id],
  );
  if (!run) return null;
  const next = await advance(run);
  return next.status === "active" ? toRun(next, user.id) : null;
}

// Moves a run forward when someone looks at it: the bot partner's proof, then
// finishing or expiring. This is why no background worker is needed.
export async function advance(run: RunRow): Promise<RunRow> {
  if (run.status !== "active") return run;
  const rows = await members(run.id);
  await rescueStuckVerdicts(run);
  await botProof(run, rows);
  return settle(run.id);
}

async function rescueStuckVerdicts(run: RunRow) {
  const stuck = await query<{ id: string }>(
    "select id from submissions where run_id = $1 and verdict = 'pending' and created_at < $2::timestamptz",
    [run.id, new Date(Date.now() - STUCK_VERDICT_MS).toISOString()],
  );
  for (const s of stuck) await applyVerdict(s.id, "approved", "we couldn't check this one automatically, so it counts.");
}

async function botProof(run: RunRow, rows: MemberRow[]) {
  const bot = rows.find((m) => m.is_bot && !m.approved_at);
  if (!bot) return;
  const human = rows.find((m) => !m.is_bot && m.approved_at);
  if (!human || Date.now() - human.approved_at!.getTime() < BOT_SUBMIT_MS) return;
  const sub = await one<{ id: string }>(
    "insert into submissions (run_id, user_id, media_type) values ($1, $2, 'bot') returning id",
    [run.id, bot.user_id],
  );
  await applyVerdict(sub!.id, "approved", "looks right.");
}

// Records a verdict and pays out on approval. Safe to call twice.
export async function applyVerdict(submissionId: string, status: "approved" | "rejected", reason: string) {
  await transaction(async () => {
    const sub = await one<{ run_id: string; user_id: string; verdict: string }>(
      "select run_id, user_id, verdict from submissions where id = $1 for update",
      [submissionId],
    );
    if (!sub || sub.verdict !== "pending") return;
    await query("update submissions set verdict = $2, reason = $3 where id = $1", [submissionId, status, reason]);
    if (status === "approved") await awardCoins(sub.user_id, sub.run_id);
  });
  const sub = await one<{ run_id: string }>("select run_id from submissions where id = $1", [submissionId]);
  if (sub) await settle(sub.run_id);
}

// A pair finishes when both have approved proof, or at time-up if one did. A crew quest stays open for
// crewmates to join, so it finishes when at least two people are on it and all
// of them have approved proof, when time runs out and someone did it, or when
// someone taps "Finish now" (finishRun). A solo quest finishes on its own
// approval. A Claim challenge is a team effort, so one approval finishes it.
async function settle(runId: string): Promise<RunRow> {
  return transaction(async () => {
    const run = (await one<RunRow>("select * from quest_runs where id = $1 for update", [runId]))!;
    if (run.status !== "active") return run;
    const rows = await members(run.id);
    const approved = rows.filter((m) => m.approved_at).length;
    const pending = rows.some((m) => m.verdict === "pending");
    const timeUp = Date.now() > run.ends_at.getTime();
    const closed = Date.now() > run.ends_at.getTime() + GRACE_MS;

    const everyone = approved > 0 && approved === rows.length;
    const crewRun = run.mode === "crew" && run.crew_id != null;

    const done =
      (run.mode === "claim" && approved > 0) ||
      (crewRun ? (everyone && rows.length >= 2) || (timeUp && approved > 0) : everyone) ||
      // If your partner never sends proof, you still get your recap at time-up.
      (run.mode === "pair" && timeUp && approved > 0);

    if (done) return complete(run.id);
    if (closed && !pending) {
      return (await one<RunRow>("update quest_runs set status = 'expired' where id = $1 returning *", [run.id]))!;
    }
    return run;
  });
}

async function complete(runId: string) {
  await recordDistances(runId);
  return (await one<RunRow>("update quest_runs set status = 'completed', completed_at = now() where id = $1 returning *", [runId]))!;
}

// "Finish now" on a crew quest: your proof is in and you'd rather not wait for
// the rest of the crew, so everyone who's done gets the recap now.
export async function finishRun(user: User, id: string) {
  const run = await runForMember(user, id);
  const done = await transaction(async () => {
    const locked = (await one<RunRow>("select * from quest_runs where id = $1 for update", [run.id]))!;
    if (locked.status !== "active" || locked.mode !== "crew") return locked;
    const mine = await one("select 1 as yes from submissions where run_id = $1 and user_id = $2 and verdict = 'approved'", [run.id, user.id]);
    if (!mine) throw new HttpError(409, "add your proof first");
    return complete(run.id);
  });
  return toRun(done, user.id);
}

// How far each person walked, from their own pings.
async function recordDistances(runId: string) {
  const pings = await query<{ user_id: string; lat: number; lng: number }>(
    "select user_id, lat, lng from location_pings where run_id = $1 order by user_id, time",
    [runId],
  );
  const totals = new Map<string, number>();
  for (let i = 1; i < pings.length; i++) {
    if (pings[i].user_id !== pings[i - 1].user_id) continue;
    const step = distanceM(pings[i - 1], pings[i]);
    // Ignore GPS jitter while standing still, and impossible jumps.
    if (step >= 3 && step <= 500) totals.set(pings[i].user_id, (totals.get(pings[i].user_id) ?? 0) + step);
  }
  for (const [userId, metres] of totals) {
    await query("update run_members set distance_m = $3 where run_id = $1 and user_id = $2", [runId, userId, Math.round(metres)]);
  }
}

// Starts a crew or Claim quest. Friends who tap the same quest land on the same
// run. With no crew it's a solo quest, for anywhere quests.
export async function startRun(user: User, body: { quest_id?: string; crew_id?: string; zone_id?: string }) {
  if (!body.quest_id) throw new HttpError(400, "quest_id is required");
  const quest = await getQuest(body.quest_id);

  let crewId: string | null = body.crew_id ?? null;
  let teamId: string | null = null;
  if (body.zone_id) {
    const zone = await one<{ game_id: string; quest_id: string }>("select game_id, quest_id from zones where id = $1", [body.zone_id]);
    if (!zone) throw notFound("zone");
    if (zone.quest_id !== quest.id) throw new HttpError(400, "that isn't this zone's quest");
    const team = await one<{ id: string; crew_id: string }>(
      `select t.id, t.crew_id from game_teams t join crew_members m on m.crew_id = t.crew_id
       where t.game_id = $1 and m.user_id = $2 limit 1`,
      [zone.game_id, user.id],
    );
    if (!team) throw new HttpError(403, "your crew isn't in this game");
    teamId = team.id;
    crewId = team.crew_id;
  } else if (crewId) {
    const member = await one("select 1 as yes from crew_members where crew_id = $1 and user_id = $2", [crewId, user.id]);
    if (!member) throw new HttpError(403, "you're not in that crew");
  }

  // Friends tapping the same quest at the same moment must land on one run, so
  // finding and creating happen under a lock for that crew and quest. Starting
  // one with the crew also puts it on the crew tab, so crewmates can find it.
  const run = await transaction(async () => {
    if (crewId && !body.zone_id) {
      await query("insert into crew_quests (crew_id, quest_id, shared_by) values ($1, $2, $3) on conflict do nothing", [crewId, quest.id, user.id]);
    }
    if (crewId) {
      await query("select pg_advisory_xact_lock(hashtext($1))", [`${crewId}:${quest.id}:${body.zone_id ?? ""}`]);
      const existing = await one<RunRow>(
        `select * from quest_runs where crew_id = $1 and quest_id = $2 and status = 'active'
           and zone_id is not distinct from $3 and ends_at > now() order by started_at desc limit 1`,
        [crewId, quest.id, body.zone_id ?? null],
      );
      if (existing) {
        await query("insert into run_members (run_id, user_id) values ($1, $2) on conflict do nothing", [existing.id, user.id]);
        return existing;
      }
    }
    // You're on the run from the start, and crewmates join when they tap it.
    return createRun({ quest, mode: body.zone_id ? "claim" : "crew", members: [user.id], crewId, zoneId: body.zone_id, teamId });
  });
  return toRun(run, user.id);
}

export async function saveCheckin(user: User, runId: string, body: Partial<Checkin>) {
  await runForMember(user, runId);
  const { phase, mood } = body;
  if ((phase !== "before" && phase !== "after") || !Number.isInteger(mood) || mood! < 1 || mood! > 5) {
    throw new HttpError(400, "phase and a mood from 1 to 5 are required");
  }
  await query(
    `insert into checkins (run_id, user_id, phase, mood) values ($1, $2, $3, $4)
     on conflict (run_id, user_id, phase) do update set mood = excluded.mood`,
    [runId, user.id, phase, mood],
  );
}

export async function recordPings(user: User, runId: string, points: { lat: number; lng: number; at: string }[]) {
  await runForMember(user, runId);
  for (const p of points.slice(0, 200)) {
    if (typeof p.lat !== "number" || typeof p.lng !== "number" || !p.at) continue;
    await query("insert into location_pings (time, user_id, run_id, lat, lng) values ($1::timestamptz, $2, $3, $4, $5)", [p.at, user.id, runId, p.lat, p.lng]);
  }
}

export async function questForRun(run: RunRow) {
  return toQuest((await one<QuestRow>("select * from quests where id = $1", [run.quest_id]))!);
}
