// Applies db/migrations/ and syncs data/quests/ on the database in DATABASE_URL.
// Embedded Postgres does all of this by itself, so this is for Tiger Data.
//   --seed            add the made-up demo crews and history (safe to repeat)
//   --seed-in-demo    the same, but only when DEMO_MODE is on (used by deploys)
//   --if-configured   succeed quietly when there's no DATABASE_URL (used by deploys)
import postgres from "postgres";
import { applyMigrations, seedDemoData, syncStarterQuests, type Query } from "../src/server/db/setup";

const url = process.env.DATABASE_URL;
if (!url) {
  const quiet = process.argv.includes("--if-configured");
  console[quiet ? "log" : "error"]("DATABASE_URL is not set. Embedded Postgres migrates itself, so there's nothing to do.");
  process.exit(quiet ? 0 : 1);
}
const demo = process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
const seed = process.argv.includes("--seed") || (process.argv.includes("--seed-in-demo") && demo);

const sql = postgres(url, { max: 1, onnotice: () => {} });
const query: Query = (text, params = []) => sql.unsafe(text, params as never[]) as unknown as ReturnType<Query>;

await query("select pg_advisory_lock(7310)");
const applied = await applyMigrations(query, (text) => sql.unsafe(text));
console.log(applied.length ? `applied: ${applied.join(", ")}` : "no new migrations");
console.log(`synced ${await syncStarterQuests(query)} starter quests`);
if (seed) console.log((await seedDemoData(query)) ? "seeded demo data" : "demo data already there");
await query("select pg_advisory_unlock(7310)");
await sql.end();
