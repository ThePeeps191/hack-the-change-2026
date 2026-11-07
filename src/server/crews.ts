import "server-only";
import type { Crew, CrewMember, LeaderboardEntry, User } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { HttpError, notFound } from "@/lib/route";
import { DEMO_CREW_ID } from "./db/setup";
import { getQuest, type QuestRow, toQuest } from "./quests";

type CrewRow = { id: string; name: string; invite_code: string; created_by: string; created_at: Date; rating: number };

const WORDS = ["MAPLE", "CEDAR", "BIRCH", "ASPEN", "WILLOW", "SPRUCE", "LARCH", "ALDER", "POPLAR", "ROWAN"];

function newCode() {
  const [a, b] = crypto.getRandomValues(new Uint16Array(2));
  return `${WORDS[a % WORDS.length]}-${String(b % 100).padStart(2, "0")}${"ABCDEFGHJKMNPQRSTUVWXYZ"[(a >> 8) % 23]}`;
}

async function toCrew(row: CrewRow): Promise<Crew> {
  const members = await query<Omit<CrewMember, "joined_at"> & { joined_at: Date }>(
    `select u.id as user_id, u.display_name, u.avatar_url, u.coins, m.joined_at
     from crew_members m join users u on u.id = m.user_id where m.crew_id = $1 order by m.joined_at, u.id`,
    [row.id],
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
  return Promise.all(rows.map(toCrew));
}

export async function createCrew(user: User, name: string | undefined) {
  const clean = name?.trim().slice(0, 60);
  if (!clean) throw new HttpError(400, "give your crew a name");
  const row = await transaction(async () => {
    const crew = await one<CrewRow>(
      "insert into crews (name, invite_code, created_by) values ($1, $2, $3) returning *",
      [clean, newCode(), user.id],
    );
    await query("insert into crew_members (crew_id, user_id) values ($1, $2)", [crew!.id, user.id]);
    return crew!;
  });
  return toCrew(row);
}

async function crewFor(user: User, id: string) {
  const row = await one<CrewRow>(
    `select c.* from crews c join crew_members m on m.crew_id = c.id where c.id = $1 and m.user_id = $2`,
    [id, user.id],
  );
  if (!row) throw notFound("crew");
  return row;
}

export const getCrew = async (user: User, id: string) => toCrew(await crewFor(user, id));

export async function joinCrew(user: User, code: string | undefined) {
  const row = await one<CrewRow>("select * from crews where invite_code = $1", [code?.trim().toUpperCase() ?? ""]);
  if (!row) throw new HttpError(404, "that code doesn't match a crew. check it with your friend?");
  await query("insert into crew_members (crew_id, user_id) values ($1, $2) on conflict do nothing", [row.id, user.id]);
  return toCrew(row);
}

// Puts a demo login in the seeded crew, so a judge lands on a populated crew
// tab and Claim map. Does nothing if the seed data isn't there.
export async function joinDemoCrew(userId: string) {
  await query(
    `insert into crew_members (crew_id, user_id)
     select id, $2 from crews where id = $1 on conflict do nothing`,
    [DEMO_CREW_ID, userId],
  );
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

// Coins count every quest a member finishes. `delta` is the last 24 hours, for
// the coins-landing animation.
export async function crewLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await query<{ id: string; name: string; coins: number; rating: number; delta: number }>(
    `select c.id, c.name, c.rating,
       coalesce(sum(u.coins), 0)::int as coins,
       coalesce((
         select sum(e.amount)::int from coin_events e
         join crew_members cm on cm.user_id = e.user_id
         where cm.crew_id = c.id and e.created_at > now() - interval '1 day'
       ), 0) as delta
     from crews c
     left join crew_members m on m.crew_id = c.id
     left join users u on u.id = m.user_id
     group by c.id
     order by coins desc, c.name
     limit 50`,
  );
  return rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, coins: r.coins, rating: Math.round(r.rating), delta: r.delta }));
}

export async function memberLeaderboard(user: User, crewId: string): Promise<LeaderboardEntry[]> {
  const crew = await toCrew(await crewFor(user, crewId));
  return [...crew.members]
    .sort((a, b) => b.coins - a.coins)
    .map((m, i) => ({ rank: i + 1, id: m.user_id, name: m.display_name, coins: m.coins }));
}
