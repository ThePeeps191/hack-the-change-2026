import "server-only";
import type { Prefs, User } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { HttpError } from "@/lib/route";
import { deleteUpload } from "@/lib/uploads";

export type UserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  age_confirmed_at: Date | null;
  prefs: Prefs;
  coins: number;
  created_at: Date;
};

export function toUser(r: UserRow): User {
  return {
    id: r.id,
    display_name: r.display_name,
    avatar_url: r.avatar_url,
    email_verified: r.email_verified,
    age_confirmed_at: r.age_confirmed_at?.toISOString() ?? null,
    prefs: r.prefs ?? {},
    coins: r.coins,
    created_at: r.created_at.toISOString(),
  };
}

// Looks the person up on every request, and only writes when something changed.
export async function findOrCreateUser(input: {
  sub: string;
  name: string;
  avatar?: string | null;
  verified: boolean;
  ageConfirmed?: boolean;
}): Promise<User> {
  const existing = await one<UserRow>("select * from users where auth0_sub = $1", [input.sub]);
  if (existing) {
    if (existing.email_verified === input.verified) return toUser(existing);
    const updated = await one<UserRow>("update users set email_verified = $2 where id = $1 returning *", [existing.id, input.verified]);
    return toUser(updated!);
  }
  await query(
    `insert into users (auth0_sub, display_name, avatar_url, email_verified, age_confirmed_at)
     values ($1, $2, $3, $4, case when $5::boolean then now() end)
     on conflict (auth0_sub) do nothing`,
    [input.sub, input.name, input.avatar ?? null, input.verified, input.ageConfirmed ?? false],
  );
  return toUser((await one<UserRow>("select * from users where auth0_sub = $1", [input.sub]))!);
}

export async function updateProfile(user: User, patch: { display_name?: string; age_confirmed_at?: string | null; prefs?: Prefs }) {
  const name = patch.display_name?.trim().slice(0, 40);
  if (patch.display_name !== undefined && !name) throw new HttpError(400, "pick a name to show people");
  const row = await one<UserRow>(
    `update users set
       display_name = coalesce($2, display_name),
       age_confirmed_at = case when $3::boolean then coalesce(age_confirmed_at, now()) else age_confirmed_at end,
       prefs = coalesce($4::text::jsonb, prefs)
     where id = $1 returning *`,
    [user.id, name ?? null, !!patch.age_confirmed_at, patch.prefs ? JSON.stringify(cleanPrefs(patch.prefs)) : null],
  );
  return toUser(row!);
}

function cleanPrefs(p: Prefs): Prefs {
  const out: Prefs = {};
  if (p.pace === "any" || p.pace === "short" || p.pace === "brisk") out.pace = p.pace;
  if (typeof p.step_free === "boolean") out.step_free = p.step_free;
  if (p.social === "chatty" || p.social === "side-by-side") out.social = p.social;
  if (typeof p.language === "string" && /^[a-zA-Z-]{2,12}$/.test(p.language)) out.language = p.language;
  return out;
}

// Everything we hold about you, as one JSON file. Transparency, not a feature.
export async function exportMyData(user: User) {
  const [runs, submissions, pings, checkins, coins, connections, reports, crews] = await Promise.all([
    query("select r.id, q.title, r.mode, r.status, r.started_at, r.completed_at, m.distance_m from run_members m join quest_runs r on r.id = m.run_id join quests q on q.id = r.quest_id where m.user_id = $1 order by r.started_at", [user.id]),
    query("select run_id, media_type, verdict, reason, lat, lng, taken_at, created_at from submissions where user_id = $1 order by created_at", [user.id]),
    query("select time, run_id, lat, lng from location_pings where user_id = $1 order by time", [user.id]),
    query("select run_id, phase, mood, created_at from checkins where user_id = $1 order by created_at", [user.id]),
    query("select run_id, amount, created_at from coin_events where user_id = $1 order by created_at", [user.id]),
    query("select u.display_name, c.created_at from connections c join users u on u.id = case when c.user_a = $1 then c.user_b else c.user_a end where $1 in (c.user_a, c.user_b)", [user.id]),
    query("select run_id, reason, created_at from reports where reporter_id = $1 order by created_at", [user.id]),
    query("select c.name, m.joined_at from crew_members m join crews c on c.id = m.crew_id where m.user_id = $1", [user.id]),
  ]);
  return { exported_at: new Date().toISOString(), profile: user, runs, submissions, location_pings: pings, checkins, coins, connections, reports_you_made: reports, crews };
}

// Removes what's personal and keeps an anonymous row, so a partner's history
// and the crew totals stay intact. The login is unlinked, so signing in again
// starts a fresh account.
//
// Sam is different. With AUTH_MODE=mock every visitor is Sam, so the next judge
// would find the demo empty. For Sam we delete what a visitor added (location,
// availability, photos) and keep the login, crew and made-up history.
export async function deleteMyData(user: User) {
  const files = await query<{ media_path: string }>("select media_path from submissions where user_id = $1 and media_path is not null", [user.id]);
  const shared = (await one<{ auth0_sub: string }>("select auth0_sub from users where id = $1", [user.id]))?.auth0_sub === "mock|sam";
  await transaction(async () => {
    await query("delete from availability where user_id = $1", [user.id]);
    await query("delete from location_pings where user_id = $1", [user.id]);
    await query("delete from checkins where user_id = $1", [user.id]);
    await query("update submissions set media_url = null, media_path = null, lat = null, lng = null where user_id = $1", [user.id]);
    await query("update matches set status = 'expired', updated_at = now() where status = 'pending' and $1 in (user_a, user_b)", [user.id]);
    await query("update matches set lat = null, lng = null where $1 in (user_a, user_b)", [user.id]);
    if (shared) return;
    await query("delete from crew_members where user_id = $1", [user.id]);
    await query("delete from connections where $1 in (user_a, user_b)", [user.id]);
    await query(
      `update users set auth0_sub = 'deleted|' || id, display_name = 'someone', avatar_url = null,
         email_verified = false, age_confirmed_at = null, prefs = '{}', coins = 0
       where id = $1`,
      [user.id],
    );
  });
  await Promise.all(files.map((f) => deleteUpload(f.media_path)));
}
