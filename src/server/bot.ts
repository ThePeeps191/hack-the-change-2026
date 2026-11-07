import "server-only";
import { one, query } from "@/lib/db";
import { AUTH_MODE, DEMO_MODE } from "@/lib/env";

// Priya, a made-up partner, so one person can do the whole flow: a developer
// clicking through alone, or a judge with no second phone. She appears when
// nobody real is free, says yes, sends proof and opts in to stay in touch.
//
// She shows up for everyone in DEMO_MODE, and for the default mock user Sam.
// Named mock users (/?as=alice) never get her, so two tabs can really match.

const BOT_SUB = "bot|priya";

export async function botPartnerFor(userId: string) {
  if (DEMO_MODE) return true;
  if (AUTH_MODE !== "mock") return false;
  const row = await one<{ auth0_sub: string }>("select auth0_sub from users where id = $1", [userId]);
  return row?.auth0_sub === "mock|sam";
}

let cached: string | null = null;

export async function botId() {
  if (cached) return cached;
  await query(
    `insert into users (auth0_sub, display_name, email_verified, age_confirmed_at, is_bot)
     values ($1, 'Priya', true, now(), true) on conflict (auth0_sub) do nothing`,
    [BOT_SUB],
  );
  const row = await one<{ id: string }>("select id from users where auth0_sub = $1", [BOT_SUB]);
  cached = row!.id;
  return cached;
}
