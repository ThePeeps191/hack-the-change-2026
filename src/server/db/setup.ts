// Migrations, starter quests and seed data. No "server-only" here, because the
// scripts in scripts/ import this outside of Next.js too.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CAMPUS_ZONES } from "./claim-zones";

export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
export type Exec = (text: string) => Promise<unknown>;

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");
const QUESTS_DIR = path.join(process.cwd(), "data", "quests");

// Applies every file in db/migrations/ that hasn't run yet, in filename order.
export async function applyMigrations(query: Query, exec: Exec) {
  await exec("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await query("select name from schema_migrations")).map((r) => r.name as string));
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    await exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
    await query("insert into schema_migrations (name) values ($1)", [file]);
    applied.push(file);
  }
  return applied;
}

type StarterQuest = {
  id: string;
  title: string;
  description: string;
  type: string;
  lat: number | null;
  lng: number | null;
  radius_m: number | null;
  duration_min: number;
  proof: string;
  coins?: number; // Claim challenges have none: Claim is about holding spots, not coins
  place_name: string | null;
  sources?: unknown[];
  tags?: string[];
};

// Quests that must exist (runs and zones point at them) but never show up in a
// quest list: not starter, and dated long before the "recently written" window
// that listQuests and the area cache look at. No schema change needed.
const UNLISTED_AT = "2000-01-01T00:00:00Z";
const CLAIM_QUESTS_FILE = path.join(process.cwd(), "data", "claim-quests.json");

async function upsertQuest(query: Query, q: StarterQuest, listed: boolean) {
  await query(
    `insert into quests (id, title, description, type, lat, lng, radius_m, duration_min, proof, coins, place_name, sources, tags, starter, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text::jsonb, $13::text::jsonb, $14, coalesce($15::timestamptz, now()))
     on conflict (id) do update set
       title = excluded.title, description = excluded.description, type = excluded.type,
       lat = excluded.lat, lng = excluded.lng, radius_m = excluded.radius_m,
       duration_min = excluded.duration_min, proof = excluded.proof, coins = excluded.coins,
       place_name = excluded.place_name, sources = excluded.sources, tags = excluded.tags, starter = excluded.starter,
       created_at = case when excluded.starter then quests.created_at else excluded.created_at end`,
    [
      q.id, q.title, q.description, q.type, q.lat, q.lng, q.radius_m, q.duration_min, q.proof, q.coins ?? 0, q.place_name,
      JSON.stringify(q.sources ?? []), JSON.stringify(q.tags ?? []), listed, listed ? null : UNLISTED_AT,
    ],
  );
}

// Copies data/quests/*.json into the quests table as the starter pack, and
// data/claim-quests.json as the Claim board's own (unlisted) quests. A starter
// quest removed from data/quests/ is unlisted, not deleted, because old runs
// still point at it. data/quests/ stays the source of truth for the starter pack.
export async function syncStarterQuests(query: Query) {
  const files = readdirSync(QUESTS_DIR).filter((f) => f.endsWith(".json")).sort();
  const quests = files.flatMap((f) => JSON.parse(readFileSync(path.join(QUESTS_DIR, f), "utf8")) as StarterQuest[]);
  for (const q of quests) await upsertQuest(query, q, true);

  const claim = JSON.parse(readFileSync(CLAIM_QUESTS_FILE, "utf8")) as (StarterQuest & { zone: { name: string; lat: number; lng: number; radius_m: number } })[];
  for (const q of claim) {
    await upsertQuest(query, q, false);
    // A spot moved or renamed in the file moves in games already running too.
    // Its score unit stays put there, since the best score was measured in it.
    await query("update zones set name = $2, lat = $3, lng = $4, radius_m = $5 where quest_id = $1", [q.id, q.zone.name, q.zone.lat, q.zone.lng, q.zone.radius_m]);
  }

  // Never unlist everything because a file came back empty.
  if (quests.length > 0) {
    await query(
      `update quests set starter = false, created_at = $2::timestamptz
       where starter and id not in (select jsonb_array_elements_text($1::text::jsonb))`,
      [JSON.stringify(quests.map((q) => q.id)), UNLISTED_AT],
    );
  }
  return quests.length;
}

// Fixed ids and "on conflict do nothing" everywhere, so seeding again changes
// nothing and a seed that stopped halfway finishes the job. People are looked up
// by auth0_sub, because Sam and Priya may already exist with other ids.
// Made-up people only.
const crewId = (n: number) => `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const runId = (n: number) => `d0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const seedId = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const SEED_GAME = "e0000000-0000-4000-8000-000000000001";
const TEAM_US = "f0000000-0000-4000-8000-000000000001";
const TEAM_THEM = "f0000000-0000-4000-8000-000000000002";

export const DEMO_CREW_ID = crewId(1);
export const DEMO_RIVAL_ID = crewId(2);
export const DEMO_GAME_ID = SEED_GAME;
// Who holds each campus zone at the start, in CAMPUS_ZONES order:
// [us or them or nobody, best result]. A "Try the demo" copy starts from this too.
export const SEED_HOLDERS: ["us" | "them" | null, number | null][] = [["us", 1891], ["them", 4], [null, null], ["them", 3], [null, null]];

const PEOPLE: [string, string, number][] = [
  ["mock|sam", "Sam", 240],
  ["bot|priya", "Priya", 180],
  ["seed|theo", "Theo", 410],
  ["seed|mina", "Mina", 330],
  ["seed|jo", "Jo", 200],
  ["seed|ren", "Ren", 790],
  ["seed|ana", "Ana", 630],
  ["seed|kofi", "Kofi", 960],
  ["seed|lea", "Lea", 720],
  ["seed|omar", "Omar", 510],
];

const CREWS: [number, string, string, number, string[]][] = [
  [1, "the long way round", "MAPLE-42", 1542, ["mock|sam", "seed|theo", "seed|mina", "seed|jo"]],
  [2, "north campus walkers", "CEDAR-17", 1610, ["seed|ren", "seed|ana"]],
  [3, "oval regulars", "BIRCH-08", 1498, ["seed|kofi"]],
  [4, "the 4th floor", "ASPEN-33", 1455, ["seed|lea"]],
  [5, "snack scouts", "WILLOW-5", 1402, ["seed|omar"]],
];

// Jo twice, so "familiar faces" has something to show. Never Priya: she is
// the practice partner, and a history would make her look like an old friend.
// [quest, days ago, partner, metres walked, minutes taken, what the recap says]
const HISTORY: [string, number, string | null, number, number, string][] = [
  ["48359d56-748a-4a9a-85b9-388c730a447c", 0, "seed|jo", 640, 18, "Sam and Jo found a free table and went to sudden death after a 4-4 tie."], // Play Foosball
  ["3143141c-f538-4b52-a123-76f36c91572b", 1, "seed|theo", 580, 14, "Sam and Theo walked up for the view and caught the towers in the afternoon sun."], // Downtown View
  ["febb791a-b824-4680-97d1-fca36894e28b", 2, "seed|jo", 760, 12, "Sam and Jo waited by the water until a duck finally paddled into the shot."], // Film a Duck
  ["9271a6b7-7bcf-4d92-bbdf-d39fc24fd1e5", 4, "seed|mina", 940, 16, "Sam and Mina ran a short stretch backwards and laughed for most of it."], // Run Backwards
  ["4379f1a6-ae68-4d5d-99d6-156602a2435c", 6, null, 1120, 19, "The long way round asked around campus and came back with a pile of answers."], // The Wisdom of the Crowd
];

// A "Try the demo" guest's own copy of HISTORY, so a judge's You page shows
// what it looks like after a few quests: the weekly ring, Jo as a familiar
// face, places on the map, the mood card. The runs are marked sample, so the
// weekly crew board skips them and the You page says they're samples. Only once
// per person, and only if they've done nothing yet. Needs seedDemoData first.
export async function seedSampleHistory(query: Query, userId: string) {
  const [busy] = await query("select 1 as yes from run_members where user_id = $1 limit 1", [userId]);
  if (busy) return false;
  let total = 0;
  for (const [i, [questId, daysAgo, partnerSub, metres, minutes, summary]] of HISTORY.entries()) {
    const [quest] = await query("select coins from quests where id = $1", [questId]);
    const [partner] = partnerSub ? await query("select id from users where auth0_sub = $1", [partnerSub]) : [null];
    if (!quest || (partnerSub && !partner)) continue;
    const startedAt = new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000);
    const completedAt = new Date(startedAt.getTime() + minutes * 60_000);
    const [run] = await query(
      `insert into quest_runs (quest_id, mode, status, started_at, ends_at, completed_at, sample)
       values ($1, $2, 'completed', $3::timestamptz, $4::timestamptz, $4::timestamptz, true) returning id`,
      [questId, partner ? "pair" : "crew", startedAt.toISOString(), completedAt.toISOString()],
    );
    for (const member of partner ? [userId, partner.id as string] : [userId]) {
      await query("insert into run_members (run_id, user_id, distance_m) values ($1, $2, $3)", [run.id, member, metres]);
      await query("insert into submissions (run_id, user_id, verdict, reason) values ($1, $2, 'approved', 'looks right.')", [run.id, member]);
    }
    await query("insert into recaps (run_id, summary) values ($1, $2)", [run.id, summary.replace(/^Sam\b/, "You")]);
    await query("insert into coin_events (user_id, run_id, amount, created_at) values ($1, $2, $3, $4::timestamptz)", [userId, run.id, quest.coins, completedAt.toISOString()]);
    total += quest.coins as number;
    // How they felt before and after the first two, so the mood card has a pattern.
    if (i < 2) {
      await query("insert into checkins (run_id, user_id, phase, mood, created_at) values ($1, $2, 'before', 3, $3::timestamptz)", [run.id, userId, startedAt.toISOString()]);
      await query("insert into checkins (run_id, user_id, phase, mood, created_at) values ($1, $2, 'after', $3, $4::timestamptz)", [run.id, userId, 5 - i, completedAt.toISOString()]);
    }
  }
  await query("update users set coins = coins + $2 where id = $1", [userId, total]);
  return true;
}

// [quest, crewmate who shared it with the crew]
const CREW_SHARED: [string, string][] = [
  ["febb791a-b824-4680-97d1-fca36894e28b", "seed|mina"], // Film a Duck, West Campus Park
  ["a9129295-d5c5-4964-8b0f-a4f6956e3dec", "seed|theo"], // Lucky Eights, Chinatown
  ["faf105ad-114b-44fb-b2b1-e5909f23b8d9", "seed|jo"], // A Look Into Calgary's Past, Central Library
];

export async function seedDemoData(query: Query) {
  const [existing] = await query("select 1 as yes from zones where game_id = $1 limit 1", [SEED_GAME]);

  const ids = new Map<string, string>();
  for (const [sub, name, coins] of PEOPLE) {
    await query(
      `insert into users (auth0_sub, display_name, email_verified, age_confirmed_at, coins, is_bot)
       values ($1, $2, true, now(), $3, $4)
       on conflict (auth0_sub) do nothing`,
      [sub, name, coins, sub.startsWith("bot|")],
    );
    const [row] = await query("select id from users where auth0_sub = $1", [sub]);
    ids.set(sub, row.id as string);
  }
  const person = (sub: string) => ids.get(sub)!;
  const sam = person("mock|sam");

  for (const [n, name, code, rating, members] of CREWS) {
    await query(
      "insert into crews (id, name, invite_code, created_by, rating) values ($1, $2, $3, $4, $5) on conflict do nothing",
      [crewId(n), name, code, person(members[0]), rating],
    );
    for (const member of members) {
      await query("insert into crew_members (crew_id, user_id) values ($1, $2) on conflict do nothing", [crewId(n), person(member)]);
    }
  }
  // Quests crewmates sent the crew, so the crew tab has something to start together.
  for (const [questId, sharedBy] of CREW_SHARED) {
    await query("insert into crew_quests (crew_id, quest_id, shared_by) values ($1, $2, $3) on conflict do nothing", [DEMO_CREW_ID, questId, person(sharedBy)]);
  }
  await query(
    "insert into coin_events (id, user_id, crew_id, amount) values ($1, $2, $3, 30) on conflict do nothing",
    [seedId("b0000000", 1), sam, DEMO_CREW_ID],
  );
  // This week's coins for everyone else, so the weekly board has a race on it.
  for (const [i, [sub, , coins]] of PEOPLE.entries()) {
    if (sub === "mock|sam" || sub.startsWith("bot|")) continue;
    await query(
      "insert into coin_events (id, user_id, amount, created_at) values ($1, $2, $3, now() - interval '2 days') on conflict do nothing",
      [seedId("b0000000", 100 + i), person(sub), Math.round(coins / 3)],
    );
  }

  for (const [i, [questId, daysAgo, partner, metres, minutes, summary]] of HISTORY.entries()) {
    const n = i + 1;
    const startedAt = new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000);
    const completedAt = new Date(startedAt.getTime() + minutes * 60_000);
    await query(
      `insert into quest_runs (id, quest_id, mode, status, started_at, ends_at, completed_at)
       values ($1, $2, $3, 'completed', $4::timestamptz, $5::timestamptz, $5::timestamptz)
       on conflict (id) do update set completed_at = quest_runs.started_at + $6::int * interval '1 minute', ends_at = quest_runs.started_at + $6::int * interval '1 minute'`,
      [runId(n), questId, partner ? "pair" : "crew", startedAt.toISOString(), completedAt.toISOString(), minutes],
    );
    // Priya is the practice partner, so she has no history with Sam. Older
    // seeds put her on two of these runs; take her off them.
    await query("delete from submissions where run_id = $1 and user_id = $2", [runId(n), person("bot|priya")]);
    await query("delete from run_members where run_id = $1 and user_id = $2", [runId(n), person("bot|priya")]);
    for (const [j, member] of (partner ? [sam, person(partner)] : [sam]).entries()) {
      await query("insert into run_members (run_id, user_id, distance_m) values ($1, $2, $3) on conflict do nothing", [runId(n), member, metres]);
      await query(
        "insert into submissions (id, run_id, user_id, verdict, reason) values ($1, $2, $3, 'approved', 'looks right.') on conflict do nothing",
        [seedId("a0000000", n * 10 + j), runId(n), member],
      );
    }
    await query("insert into recaps (run_id, summary) values ($1, $2) on conflict (run_id) do update set summary = excluded.summary", [runId(n), summary]);
    const [q] = await query("select coins from quests where id = $1", [questId]);
    await query(
      // Updates the amount on a reseed, so history matches the quest's current coins.
      `insert into coin_events (user_id, run_id, amount, created_at) values ($1, $2, $3, $4::timestamptz)
       on conflict (user_id, run_id) where run_id is not null do update set amount = excluded.amount`,
      [sam, runId(n), q.coins, completedAt.toISOString()],
    );
  }

  await query("insert into games (id, name, created_by) values ($1, 'the weekend on campus', $2) on conflict (id) do update set name = excluded.name", [SEED_GAME, sam]);
  await query("insert into game_teams (id, game_id, crew_id, name) values ($1, $2, $3, 'the long way round') on conflict do nothing", [TEAM_US, SEED_GAME, crewId(1)]);
  await query("insert into game_teams (id, game_id, crew_id, name) values ($1, $2, $3, 'north campus walkers') on conflict do nothing", [TEAM_THEM, SEED_GAME, crewId(2)]);
  const team = { us: TEAM_US, them: TEAM_THEM };
  for (const [i, z] of CAMPUS_ZONES.entries()) {
    await query(
      `insert into zones (id, game_id, name, lat, lng, radius_m, quest_id, held_by_team_id, best_result, result_unit, lower_is_better)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) on conflict do nothing`,
      [seedId("90000000", i + 1), SEED_GAME, z.name, z.lat, z.lng, z.radius_m, z.quest_id, SEED_HOLDERS[i][0] && team[SEED_HOLDERS[i][0]], SEED_HOLDERS[i][1], z.result_unit, z.lower_is_better],
    );
  }
  return !existing;
}
