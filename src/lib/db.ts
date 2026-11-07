import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { applyMigrations, seedDemoData, syncStarterQuests } from "@/server/db/setup";

// One small seam over two engines, so the same SQL runs everywhere:
// - DATABASE_URL set: real Postgres (Tiger Data), through the postgres client.
// - DATABASE_URL unset: embedded Postgres (PGlite) in .data/, one per worktree,
//   which needs no setup and migrates and seeds itself on first use.
// Use integer rather than bigint, and cast aggregates (count(*)::int), because
// the two drivers return bigint differently. Pass jsonb as $1::text::jsonb.

type Row = Record<string, unknown>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;
type Engine = {
  kind: "embedded" | "postgres";
  run: Runner;
  exec: (text: string) => Promise<unknown>;
  transaction: <T>(fn: (run: Runner) => Promise<T>) => Promise<T>;
};

const g = globalThis as unknown as { __ambleDb?: Promise<Engine> };
const inTransaction = new AsyncLocalStorage<Runner>();

async function connectEmbedded(): Promise<Engine> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (!dir.startsWith("memory://")) mkdirSync(path.dirname(dir), { recursive: true });
  const lite = await PGlite.create(dir);
  return {
    kind: "embedded",
    run: async (text, params = []) => (await lite.query<Row>(text, params)).rows,
    exec: (text) => lite.exec(text),
    transaction: (fn) => lite.transaction((tx) => fn(async (text, params = []) => (await tx.query<Row>(text, params)).rows)) as Promise<never>,
  };
}

async function connectPostgres(url: string): Promise<Engine> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, onnotice: () => {} });
  return {
    kind: "postgres",
    run: (text, params = []) => sql.unsafe(text, params as never[]) as unknown as Promise<Row[]>,
    exec: (text) => sql.unsafe(text),
    transaction: (fn) =>
      sql.begin((tx) => fn((text, params = []) => tx.unsafe(text, params as never[]) as unknown as Promise<Row[]>)) as Promise<never>,
  };
}

async function open(): Promise<Engine> {
  const url = process.env.DATABASE_URL;
  const engine = url ? await connectPostgres(url) : await connectEmbedded();
  // Real databases are migrated by `bun run db:migrate`, not by whichever app
  // process happens to start first.
  if (engine.kind === "embedded") {
    await applyMigrations(engine.run, engine.exec);
    await syncStarterQuests(engine.run);
    await seedDemoData(engine.run);
  }
  return engine;
}

function engine() {
  g.__ambleDb ??= open().catch((e) => {
    g.__ambleDb = undefined; // let the next request try again
    throw e;
  });
  return g.__ambleDb;
}

// Runs inside the current transaction if there is one.
export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const run = inTransaction.getStore() ?? (await engine()).run;
  return (await run(text, params)) as T[];
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}

// Every query() inside fn joins the transaction. A throw rolls it all back.
// Don't call after() or anything slow (Gemini) in here.
export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  if (inTransaction.getStore()) return fn();
  const e = await engine();
  return e.transaction((run) => inTransaction.run(run, fn));
}

export async function databaseKind() {
  return (await engine()).kind;
}
