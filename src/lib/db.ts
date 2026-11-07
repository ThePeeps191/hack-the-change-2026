import "server-only";
import postgres from "postgres";

// One shared client, created on first use so mock mode never needs DATABASE_URL.
// The dev database is shared: never drop, truncate or reset it.
let client: ReturnType<typeof postgres> | null = null;

export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  client ??= postgres(process.env.DATABASE_URL);
  return client;
}
