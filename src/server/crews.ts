import "server-only";
import type { Crew, CrewMember, LeaderboardEntry, User } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { HttpError, notFound } from "@/lib/route";
import { DEMO_CREW_ID } from "./db/setup";
import { getQuest, type QuestRow, toQuest } from "./quests";

type CrewRow = { id: string; name: string; invite_code: string; created_by: string; created_at: Date; rating: number };

const WORDS = ["MAPLE", "CEDAR", "BIRCH", "ASPEN", "WILLOW", "SPRUCE", "LARCH", "ALDER", "POPLAR", "ROWAN"];

export function newCode() {
  const [a, b] = crypto.getRandomValues(new Uint16Array(2));
  return `${WORDS[a % WORDS.length]}-${String(b % 100).padStart(2, "0")}${"ABCDEFGHJKMNPQRSTUVWXYZ"[(a >> 8) % 23]}`;
}

// There are about 23,000 codes and every demo login makes two crews, so on a
// busy judging day two would clash. Pick one nobody has yet.
export async function freshCode() {
  for (let i = 0; i < 20; i++) {
    const code = newCode();
    if (!(await one("select 1 as yes from crews where invite_code = $1", [code]))) return code;
  }
  throw new HttpError(503, "couldn't find a free crew code. try again?");
}

// Every "Try the demo" login joins the seeded crew, so judges would see a
// growing list of Guests. Other demo logins are left out of the member list;
// you always see yourself.
async function toCrew(row: CrewRow, viewerId?: string): Promise<Crew> {
  const members = await query<Omit<CrewMember, "joined_at"> & { joined_at: Date }>(
    `select u.id as user_id, u.display_name, u.avatar_url, u.coins, m.joined_at
     from crew_members m join users u on u.id = m.user_id
     where m.crew_id = $1 and (u.auth0_sub not like 'demo|%' or u.id = $2)
     order by m.joined_at, u.id`,
    [row.id, viewerId ?? null],
  );
  const shared = await query<QuestRow>(
    `select q.* from crew_quests c join quests q on q.id = c.quest_id where c.crew_id = $1 order by c.created_at desc`,
    [row.id],
  );
  return {
    id: row.id,
    name: row.name,
    invite_code: row.invite_code,
    created_by: row.created_by,
    created_at: row.created_at.toISOString(),
    members: members.map((m) => ({ ...m, joined_at: m.joined_at.toISOString() })),
    shared_quests: shared.map(toQuest),
    coins: members.reduce((sum, m) => sum + m.coins, 0),
    rating: Math.round(row.rating),
  };
}

export async function myCrews(user: User) {
  const rows = await query<CrewRow>(
    `select c.* from crews c join crew_members m on m.crew_id = c.id
     where m.user_id = $1 order by m.joined_at, c.id`,
    [user.id],
  );
  return Promise.all(rows.map((r) => toCrew(r, user.id)));
}

export async function createCrew(user: User, name: string | undefined) {
  const clean = name?.trim().slice(0, 60);
  if (!clean) throw new HttpError(400, "give your crew a name");
  const row = await transaction(async () => {
    const crew = await one<CrewRow>(
      "insert into crews (name, invite_code, created_by) values ($1, $2, $3) returning *",
      [clean, await freshCode(), user.id],
    );
    await query("insert into crew_members (crew_id, user_id) values ($1, $2)", [crew!.id, user.id]);
    return crew!;
  });
  return toCrew(row, user.id);
}

async function crewFor(user: User, id: string) {
  const row = await one<CrewRow>(
    `select c.* from crews c join crew_members m on m.crew_id = c.id where c.id = $1 and m.user_id = $2`,
    [id, user.id],
  );
  if (!row) throw notFound("crew");
  return row;
}

export const getCrew = async (user: User, id: string) => toCrew(await crewFor(user, id), user.id);

// Just the crew's name, so the join page can name it or say the code is wrong
// before anyone taps Join.
export async function crewNameForCode(code: string | null) {
  const row = await one<{ name: string }>("select name from crews where invite_code = $1", [code?.trim().toUpperCase() ?? ""]);
  if (!row) throw new HttpError(404, "That code doesn't match a crew. Check it with your friend.");
  return row;
}

export async function joinCrew(user: User, code: string | undefined) {
  const row = await one<CrewRow>("select * from crews where invite_code = $1", [code?.trim().toUpperCase() ?? ""]);
  if (!row) throw new HttpError(404, "That code doesn't match a crew. Check it with your friend.");
  await query("insert into crew_members (crew_id, user_id) values ($1, $2) on conflict do nothing", [row.id, user.id]);
  return toCrew(row, user.id);
}

// Leaving takes you off the member list and nothing else: your coins stay
// yours, and the invite code still works if you want back in. A crew nobody is
// in drops off the weekly board.
export async function leaveCrew(user: User, crewId: string) {
  await crewFor(user, crewId);
  await query("delete from crew_members where crew_id = $1 and user_id = $2", [crewId, user.id]);
}

export async function shareQuest(user: User, crewId: string, questId: string | undefined) {
  await crewFor(user, crewId);
  if (!questId) throw new HttpError(400, "quest_id is required");
  await getQuest(questId);
  await query(
    "insert into crew_quests (crew_id, quest_id, shared_by) values ($1, $2, $3) on conflict do nothing",
    [crewId, questId, user.id],
  );
}

// The weekly board: coins the crew's members earned in the last 7 days, on any
// quest, so a quiet week starts everyone level again. `delta` is the last 24
// hours, for the coins-landing animation. A crew's own page shows all-time coins.
// Crews copied for a "Try the demo" visitor show only to that visitor, in place
// of the seeded crew they copy, so a judge sees one "the long way round": theirs.
export async function crewLeaderboard(user: User): Promise<LeaderboardEntry[]> {
  const rows = await query<{ id: string; name: string; coins: number; rating: number; delta: number }>(
    `select c.id, c.name, c.rating,
       coalesce(sum(e.amount) filter (where e.created_at > now() - interval '7 days'), 0)::int as coins,
       coalesce(sum(e.amount) filter (where e.created_at > now() - interval '1 day'), 0)::int as delta
     from crews c
     left join crew_members m on m.crew_id = c.id
     left join coin_events e on e.user_id = m.user_id
       and not exists (select 1 from quest_runs r where r.id = e.run_id and r.sample)
     join users creator on creator.id = c.created_by
     -- A demo visitor's copy of the seeded crews shows only to them. Deleting your
     -- data renames you to 'deleted|...', and your copy must stay hidden then too,
     -- or every visitor would see a second "the long way round".
     where ((creator.auth0_sub not like 'demo|%' and creator.auth0_sub not like 'deleted|%')
            or exists (select 1 from crew_members x where x.crew_id = c.id and x.user_id = $1))
       and not (c.id = $2 and exists (
         select 1 from crew_members x join crews y on y.id = x.crew_id join users z on z.id = y.created_by
         where x.user_id = $1 and z.auth0_sub like 'demo|%'))
     group by c.id
     having count(m.user_id) > 0
     order by coins desc, c.name
     limit 50`,
    [user.id, DEMO_CREW_ID],
  );
  return rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, coins: r.coins, rating: Math.round(r.rating), delta: r.delta }));
}

export async function memberLeaderboard(user: User, crewId: string): Promise<LeaderboardEntry[]> {
  const crew = await toCrew(await crewFor(user, crewId), user.id);
  return [...crew.members]
    .sort((a, b) => b.coins - a.coins)
    .map((m, i) => ({ rank: i + 1, id: m.user_id, name: m.display_name, coins: m.coins }));
}
