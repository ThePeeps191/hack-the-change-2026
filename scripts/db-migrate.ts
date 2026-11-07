// Applies db/migrations/ and syncs data/quests/ on the database in DATABASE_URL.
// Pass --seed to add the made-up demo crews and history too (safe to repeat).
// Embedded Postgres does all of this by itself, so this is for Tiger Data.
import postgres from "postgres";
import { applyMigrations, seedDemoData, syncStarterQuests, type Query } from "../src/server/db/setup";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Embedded Postgres migrates itself, so there's nothing to do.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
const query: Query = (text, params = []) => sql.unsafe(text, params as never[]) as unknown as ReturnType<Query>;

await query("select pg_advisory_lock(7310)");
const applied = await applyMigrations(query, (text) => sql.unsafe(text));
console.log(applied.length ? `applied: ${applied.join(", ")}` : "no new migrations");
console.log(`synced ${await syncStarterQuests(query)} starter quests`);
if (process.argv.includes("--seed")) console.log((await seedDemoData(query)) ? "seeded demo data" : "demo data already there");
await query("select pg_advisory_unlock(7310)");
await sql.end();
