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
  coins: number;
  place_name: string | null;
  sources?: unknown[];
  tags?: string[];
};

// Copies data/quests/*.json into the quests table, so runs can reference them.
// data/quests/ stays the source of truth for anything marked starter.
export async function syncStarterQuests(query: Query) {
  const files = readdirSync(QUESTS_DIR).filter((f) => f.endsWith(".json")).sort();
  const quests = files.flatMap((f) => JSON.parse(readFileSync(path.join(QUESTS_DIR, f), "utf8")) as StarterQuest[]);
  for (const q of quests) {
    await query(
      `insert into quests (id, title, description, type, lat, lng, radius_m, duration_min, proof, coins, place_name, sources, tags, starter)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text::jsonb, $13::text::jsonb, true)
       on conflict (id) do update set
         title = excluded.title, description = excluded.description, type = excluded.type,
         lat = excluded.lat, lng = excluded.lng, radius_m = excluded.radius_m,
         duration_min = excluded.duration_min, proof = excluded.proof, coins = excluded.coins,
         place_name = excluded.place_name, sources = excluded.sources, tags = excluded.tags, starter = true`,
      [
        q.id, q.title, q.description, q.type, q.lat, q.lng, q.radius_m, q.duration_min, q.proof, q.coins, q.place_name,
        JSON.stringify(q.sources ?? []), JSON.stringify(q.tags ?? []),
      ],
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

// [quest id, days ago, partner, metres walked]. Priya twice, so "familiar
// faces" has something to show.
const HISTORY: [string, number, string | null, number][] = [
  ["a1b2c3d4-0001-4000-8000-000000000001", 0, "bot|priya", 640],
  ["a1b2c3d4-0002-4000-8000-000000000001", 1, "seed|theo", 580],
  ["a1b2c3d4-0001-4000-8000-000000000002", 2, "bot|priya", 760],
  ["a1b2c3d4-0003-4000-8000-000000000001", 4, "seed|mina", 940],
  ["a1b2c3d4-0004-4000-8000-000000000001", 6, null, 1120],
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
  await query(
    "insert into coin_events (id, user_id, crew_id, amount) values ($1, $2, $3, 30) on conflict do nothing",
    [seedId("b0000000", 1), sam, DEMO_CREW_ID],
  );

  for (const [i, [questId, daysAgo, partner, metres]] of HISTORY.entries()) {
    const n = i + 1;
    const startedAt = new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000);
    const completedAt = new Date(startedAt.getTime() + 17 * 60_000);
    await query(
      `insert into quest_runs (id, quest_id, mode, status, started_at, ends_at, completed_at)
       values ($1, $2, $3, 'completed', $4::timestamptz, $5::timestamptz, $5::timestamptz) on conflict do nothing`,
      [runId(n), questId, partner ? "pair" : "crew", startedAt.toISOString(), completedAt.toISOString()],
    );
    for (const [j, member] of (partner ? [sam, person(partner)] : [sam]).entries()) {
      await query("insert into run_members (run_id, user_id, distance_m) values ($1, $2, $3) on conflict do nothing", [runId(n), member, metres]);
      await query(
        "insert into submissions (id, run_id, user_id, verdict, reason) values ($1, $2, $3, 'approved', 'looks right.') on conflict do nothing",
        [seedId("a0000000", n * 10 + j), runId(n), member],
      );
    }
    await query("insert into recaps (run_id, summary) values ($1, $2) on conflict do nothing", [runId(n), "A short walk and a quest finished with time to spare."]);
    const [q] = await query("select coins from quests where id = $1", [questId]);
    await query(
      "insert into coin_events (user_id, run_id, amount, created_at) values ($1, $2, $3, $4::timestamptz) on conflict do nothing",
      [sam, runId(n), q.coins, completedAt.toISOString()],
    );
  }

  await query("insert into games (id, name, created_by) values ($1, 'saturday on campus', $2) on conflict do nothing", [SEED_GAME, sam]);
  await query("insert into game_teams (id, game_id, crew_id, name) values ($1, $2, $3, 'the long way round') on conflict do nothing", [TEAM_US, SEED_GAME, crewId(1)]);
  await query("insert into game_teams (id, game_id, crew_id, name) values ($1, $2, $3, 'north campus walkers') on conflict do nothing", [TEAM_THEM, SEED_GAME, crewId(2)]);
  const holders: [string | null, number | null][] = [[TEAM_US, 1891], [TEAM_THEM, 4], [null, null], [TEAM_THEM, 3], [null, null]];
  for (const [i, z] of CAMPUS_ZONES.entries()) {
    await query(
      `insert into zones (id, game_id, name, lat, lng, radius_m, quest_id, held_by_team_id, best_result, result_unit, lower_is_better)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) on conflict do nothing`,
      [seedId("90000000", i + 1), SEED_GAME, z.name, z.lat, z.lng, z.radius_m, z.quest_id, holders[i][0], holders[i][1], z.result_unit, z.lower_is_better],
    );
  }
  return !existing;
}
