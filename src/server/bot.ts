import "server-only";
import { one, query } from "@/lib/db";
import { AUTH_MODE, DEMO_MODE, PRACTICE_PARTNER_ON } from "@/lib/env";

// Priya, a made-up partner, so one person can do the whole flow: a developer
// clicking through alone, or a judge with no second phone. She appears when
// nobody real is free, says yes, sends proof and opts in to stay in touch.
//
// She shows up for everyone in DEMO_MODE, and for the default mock user Sam.
// Named mock users (/?as=alice) never get her, so two tabs can really match.
//
// How long someone searches before she appears: a few seconds for "Try the
// demo" guests, who are almost always a judge on their own. People signed in
// with a real account wait longer for a real person first, so two phones that
// tap "I'm free" a little apart still find each other. null means never.
const GUEST_WAIT_MS = 4000;
const SIGNED_IN_WAIT_MS = 25_000;

const BOT_SUB = "bot|priya";

export async function botWaitMs(userId: string): Promise<number | null> {
  if (!PRACTICE_PARTNER_ON) return null;
  const row = await one<{ auth0_sub: string }>("select auth0_sub from users where id = $1", [userId]);
  const sub = row?.auth0_sub ?? "";
  if (DEMO_MODE) return sub.startsWith("demo|") || sub.startsWith("mock|") ? GUEST_WAIT_MS : SIGNED_IN_WAIT_MS;
  if (AUTH_MODE === "mock" && sub === "mock|sam") return GUEST_WAIT_MS;
  return null;
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
