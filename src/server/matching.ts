import "server-only";
import type { Match, Prefs, User } from "@/lib/contracts";
import { CAMPUS_CENTER } from "@/lib/config";
import { one, query, transaction } from "@/lib/db";
import { HttpError, notFound } from "@/lib/route";
import { botId, botWaitMs } from "./bot";
import { getQuest, pickPairQuest } from "./quests";
import { createRun } from "./runs";
import { assertCanMeet, distanceM } from "./safety";

const MATCH_RADIUS_M = 2000;
const AVAILABILITY_MIN = 20;
const MATCH_EXPIRY_MS = 2 * 60_000;
const INVITE_EXPIRY_MS = 30 * 60_000;
const REMATCH_COOLDOWN_MIN = 10; // two people who just passed on each other aren't re-paired right away
const ENDED_VISIBLE_MS = 2 * 60_000; // how long a declined match stays visible to the person polling for it
const BOT_ACCEPT_MS = 2000;

type Availability = {
  user_id: string;
  lat: number;
  lng: number;
  expires_at: Date;
  created_at: Date;
  prefs?: Prefs;
};

const MISMATCH_PENALTY_M = 500;

function mismatch(a: Prefs = {}, b: Prefs = {}) {
  let penalty = 0;
  if (a.social && b.social && a.social !== b.social)
    penalty += MISMATCH_PENALTY_M;
  if ((a.pace === "short") !== (b.pace === "short") && a.pace && b.pace)
    penalty += MISMATCH_PENALTY_M;
  return penalty;
}

type MatchRow = {
  id: string;
  user_a: string;
  user_b: string | null;
  status: Match["status"];
  source: Match["source"];
  invite_code: string | null;
  quest_id: string | null;
  a_accepted_at: Date | null;
  b_accepted_at: Date | null;
  distance_m: number | null;
  lat: number | null;
  lng: number | null;
  updated_at: Date;
  run_id: string | null;
};

const SELECT_MATCH = `select m.*, r.id as run_id from matches m left join quest_runs r on r.match_id = m.id`;

async function toMatch(m: MatchRow, userId: string): Promise<Match> {
  const partnerId = m.user_a === userId ? m.user_b : m.user_a;
  const accepted = m.status === "accepted" && partnerId;
  const partner = accepted
    ? await one<{ display_name: string; avatar_url: string | null }>(
        "select display_name, avatar_url from users where id = $1",
        [partnerId],
      )
    : null;
  const together = accepted
    ? await timesTogether(userId, partnerId)
    : undefined;
  return {
    id: m.id,
    status: m.status,
    source: m.source,
    partner,
    run_id: m.run_id,
    you_accepted: !!(m.user_a === userId ? m.a_accepted_at : m.b_accepted_at),
    distance_m: m.distance_m,
    times_together: together,
    demo_partner: partnerId != null && partnerId === (await botId()),
    quest_title: m.quest_id ? (await one<{ title: string }>("select title from quests where id = $1", [m.quest_id]))?.title ?? null : null,
  };
}

// Finished quests with this person, so the app can notice regulars.
export async function timesTogether(a: string, b: string) {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from run_members x
       join run_members y on y.run_id = x.run_id and y.user_id = $2
       join quest_runs r on r.id = x.run_id
     where x.user_id = $1 and r.status = 'completed'`,
    [a, b],
  );
  return row?.n ?? 0;
}

// Also where location is forgotten: searches nobody finished, and the meeting
// point of any match that's no longer pending.
async function expireStale(userId: string) {
  await query(
    `update matches set status = 'expired', updated_at = now()
     where status = 'pending' and expires_at < now() and $1 in (user_a, user_b)`,
    [userId],
  );
  await query("delete from availability where expires_at < now()");
  await query(
    "update matches set lat = null, lng = null where status <> 'pending' and lat is not null",
  );
}

// A pending match, or an accepted one whose quest is still going. The time check
// matters: a quest nobody opened again is still marked active after it's over.
const openMatch = (userId: string) =>
  one<MatchRow>(
    `${SELECT_MATCH}
     where $1 in (m.user_a, m.user_b)
       and (m.status = 'pending' or (m.status = 'accepted' and r.status = 'active' and r.ends_at > now() - interval '2 minutes'))
     order by m.created_at desc limit 1`,
    [userId],
  );

const myAvailability = (userId: string) =>
  one<Availability>(
    "select * from availability where user_id = $1 and expires_at > now()",
    [userId],
  );

export async function setFree(user: User, lat: number, lng: number) {
  assertCanMeet(user);
  const open = await openMatch(user.id);
  if (open?.status === "accepted")
    return {
      expires_at: new Date(
        Date.now() + AVAILABILITY_MIN * 60_000,
      ).toISOString(),
    };
  if (open) await cancelPending(user.id); // saying you're free again always starts a fresh search
  const expires = new Date(Date.now() + AVAILABILITY_MIN * 60_000);
  await query(
    `insert into availability (user_id, lat, lng, expires_at) values ($1, $2, $3, $4::timestamptz)
     on conflict (user_id) do update set lat = excluded.lat, lng = excluded.lng, expires_at = excluded.expires_at, created_at = now()`,
    [user.id, lat, lng, expires.toISOString()],
  );
  await tryPair(user.id);
  return { expires_at: expires.toISOString() };
}

export async function clearFree(user: User) {
  await query("delete from availability where user_id = $1", [user.id]);
  await cancelPending(user.id);
}

async function cancelPending(userId: string) {
  await query(
    "update matches set status = 'expired', updated_at = now() where status = 'pending' and $1 in (user_a, user_b)",
    [userId],
  );
}

// Pairs you with the nearest person who's free, if there is one. The lock means
// two people polling at once can't both claim the same third person.
async function tryPair(userId: string) {
  await transaction(async () => {
    await query("select pg_advisory_xact_lock(4242)");
    const me = await one<Availability>(
      "select a.*, u.prefs from availability a join users u on u.id = a.user_id where a.user_id = $1 and a.expires_at > now()",
      [userId],
    );
    if (!me) return;
    const others = await query<Availability>(
      `select a.*, u.prefs from availability a
       join users u on u.id = a.user_id
       where a.user_id <> $1 and a.expires_at > now() and not u.is_bot
         and not exists (
           select 1 from reports r
           where (r.reporter_id = $1 and r.reported_id = a.user_id) or (r.reporter_id = a.user_id and r.reported_id = $1)
         )
         and not exists (
           select 1 from matches m
           where m.status in ('declined', 'expired')
             and ((m.user_a = $1 and m.user_b = a.user_id) or (m.user_a = a.user_id and m.user_b = $1))
             and m.updated_at > now() - make_interval(mins => ${REMATCH_COOLDOWN_MIN})
         )`,
      [userId],
    );
    const nearest = others
      .map((other) => ({
        other,
        metres: distanceM(me, other),
        fit: mismatch(me.prefs, other.prefs),
      }))
      .filter((c) => c.metres <= MATCH_RADIUS_M)
      .sort((a, b) => a.metres + a.fit - (b.metres + b.fit))[0];
    if (!nearest) return;
    await insertMatch(me, nearest.other.user_id, nearest.metres, {
      lat: (me.lat + nearest.other.lat) / 2,
      lng: (me.lng + nearest.other.lng) / 2,
    });
    await query("delete from availability where user_id = $1 or user_id = $2", [
      me.user_id,
      nearest.other.user_id,
    ]);
  });
}

async function insertMatch(
  me: Availability,
  partnerId: string,
  metres: number,
  midpoint: { lat: number; lng: number },
) {
  await query(
    `insert into matches (user_a, user_b, source, distance_m, lat, lng, expires_at)
     values ($1, $2, 'nearby', $3, $4, $5, $6::timestamptz)`,
    [
      me.user_id,
      partnerId,
      Math.round(metres),
      midpoint.lat,
      midpoint.lng,
      new Date(Date.now() + MATCH_EXPIRY_MS).toISOString(),
    ],
  );
}

// Polled by the app. Pairing, expiry and the bot partner all move forward here,
// so there's no background worker to run.
export async function currentMatch(user: User): Promise<Match | null> {
  await expireStale(user.id);
  let row = await openMatch(user.id);

  if (!row) {
    const free = await myAvailability(user.id);
    if (free) {
      await tryPair(user.id);
      row = await openMatch(user.id);
      const wait = row ? null : await botWaitMs(user.id);
      if (!row && wait != null && Date.now() - free.created_at.getTime() > wait) {
        await pairWithBot(free);
        row = await openMatch(user.id);
      }
      if (!row) return null;
    } else {
      // Not searching, so show how the last one ended if it only just did.
      const ended = await one<MatchRow>(
        `${SELECT_MATCH} where $1 in (m.user_a, m.user_b) and m.status in ('declined', 'expired') order by m.updated_at desc limit 1`,
        [user.id],
      );
      const recent =
        ended && Date.now() - ended.updated_at.getTime() < ENDED_VISIBLE_MS;
      return recent ? toMatch(ended, user.id) : null;
    }
  }

  // The bot says yes shortly after you do.
  if (row.status === "pending" && row.user_b === (await botId())) {
    const youAccepted = row.a_accepted_at;
    if (youAccepted && Date.now() - youAccepted.getTime() > BOT_ACCEPT_MS) {
      await query("update matches set b_accepted_at = now() where id = $1", [
        row.id,
      ]);
      await finalize(row.id);
      row = (await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [row.id]))!;
    }
  }
  return toMatch(row, user.id);
}

async function pairWithBot(free: Availability) {
  const bot = await botId();
  await transaction(async () => {
    await insertMatch(free, bot, 260, { lat: free.lat, lng: free.lng });
    await query("delete from availability where user_id = $1", [free.user_id]);
  });
}

async function matchFor(user: User, id: string) {
  const row = await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [id]);
  if (!row || (row.user_a !== user.id && row.user_b !== user.id))
    throw notFound("match");
  return row;
}

export async function acceptMatch(user: User, id: string): Promise<Match> {
  const row = await matchFor(user, id);
  if (row.status === "pending") {
    const side = row.user_a === user.id ? "a_accepted_at" : "b_accepted_at";
    await query(
      `update matches set ${side} = coalesce(${side}, now()), updated_at = now() where id = $1 and status = 'pending'`,
      [id],
    );
    await finalize(id);
  }
  return toMatch(
    (await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [id]))!,
    user.id,
  );
}

export async function declineMatch(user: User, id: string): Promise<Match> {
  const row = await matchFor(user, id);
  if (row.status === "pending") {
    await query(
      "update matches set status = 'declined', updated_at = now() where id = $1 and status = 'pending'",
      [id],
    );
  }
  return toMatch(
    (await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [id]))!,
    user.id,
  );
}

// Once both have said yes, the server picks the quest and creates the run. The
// status flips in the same transaction as the run, so the app never sees
// "accepted" without a run_id. Choosing the quest can be slow, so it's outside.
async function finalize(matchId: string) {
  const m = await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [matchId]);
  if (
    !m ||
    m.status !== "pending" ||
    !m.a_accepted_at ||
    !m.b_accepted_at ||
    !m.user_b
  )
    return;
  const people = await query<{ prefs: Prefs }>(
    "select prefs from users where id = $1 or id = $2",
    [m.user_a, m.user_b],
  );
  // If the invite pinned a specific quest, try to use it; fall back to picking one if not found.
  let quest;
  if (m.quest_id) {
    try {
      quest = await getQuest(m.quest_id);
    } catch {
      // Pinned quest was deleted; fall back to random selection
      console.error(
        `Pinned quest ${m.quest_id} not found, falling back to random selection`,
      );
      quest = await pickPairQuest(
        m.lat ?? CAMPUS_CENTER.lat,
        m.lng ?? CAMPUS_CENTER.lng,
        people.map((p) => p.prefs ?? {}),
      );
    }
  } else {
    quest = await pickPairQuest(
      m.lat ?? CAMPUS_CENTER.lat,
      m.lng ?? CAMPUS_CENTER.lng,
      people.map((p) => p.prefs ?? {}),
    );
  }
  const userA = m.user_a;
  const userB = m.user_b;
  await transaction(async () => {
    const fresh = await one<{ status: string }>(
      "select status from matches where id = $1 for update",
      [matchId],
    );
    if (fresh?.status !== "pending") return; // the other person's request got here first
    await createRun({ quest, mode: "pair", members: [userA, userB], matchId });
    await query(
      "update matches set status = 'accepted', lat = null, lng = null, updated_at = now() where id = $1",
      [matchId],
    );
  });
}

function inviteCode() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31],
  ).join("");
}

// A link for someone you've actually met. Making the link counts as your yes.
// Pass quest_id to pin a specific quest to this invite (for AirDrop sharing).
// Without one, we pick the quest now, so the link, the invite page and your
// waiting screen can all name it. It's picked near `near` (where the sender
// is, if their phone shares it) or else near campus. The point is only used
// to pick; it isn't saved.
export async function createInvite(
  user: User,
  origin: string,
  questId?: string,
  near?: { lat: number; lng: number },
) {
  assertCanMeet(user);
  await cancelPending(user.id);
  await query("delete from availability where user_id = $1", [user.id]);
  const code = inviteCode();
  const quest = questId ? await getQuest(questId) : await pickPairQuest(near?.lat ?? CAMPUS_CENTER.lat, near?.lng ?? CAMPUS_CENTER.lng, [user.prefs ?? {}]);
  await query(
    `insert into matches (user_a, source, invite_code, quest_id, a_accepted_at, expires_at)
     values ($1, 'invite', $2, $3, now(), $4::timestamptz)`,
    [
      user.id,
      code,
      quest.id,
      new Date(Date.now() + INVITE_EXPIRY_MS).toISOString(),
    ],
  );
  return { code, url: `${origin}/invite/${code}`, quest: { id: quest.id, title: quest.title } };
}

// Public details for an invite, so the invite screen can show the quest.
export async function inviteDetails(code: string) {
  const row = await one<{
    invite_code: string;
    quest_id: string | null;
    status: string;
    expires_at: Date;
    user_a: string;
  }>(
    "select invite_code, quest_id, status, expires_at, user_a from matches where invite_code = $1",
    [code.toUpperCase()],
  );
  if (!row) throw notFound("invite");
  const quest = row.quest_id ? await getQuest(row.quest_id) : null;
  const host = await one<{ display_name: string }>(
    "select display_name from users where id = $1",
    [row.user_a],
  );
  return {
    code: row.invite_code,
    status: row.status,
    expired: row.status !== "pending" || row.expires_at < new Date(),
    quest,
    host_id: row.user_a,
    host_name: host?.display_name ?? null,
  };
}

// Opening the link and tapping yes is the other person's yes.
export async function acceptInvite(
  user: User,
  code: string,
  pos: { lat?: number; lng?: number },
): Promise<Match> {
  assertCanMeet(user);
  const row = await one<MatchRow>(`${SELECT_MATCH} where m.invite_code = $1`, [
    code.toUpperCase(),
  ]);
  if (!row) throw notFound("invite");
  if (row.user_a === user.id)
    throw new HttpError(
      400,
      "that's your own invite. send it to someone else.",
    );
  if (row.user_b && row.user_b !== user.id)
    throw new HttpError(410, "someone else already took this invite.");
  if (row.status === "pending" && !row.user_b) {
    const lat = typeof pos.lat === "number" ? pos.lat : CAMPUS_CENTER.lat;
    const lng = typeof pos.lng === "number" ? pos.lng : CAMPUS_CENTER.lng;
    const claimed = await query(
      `update matches set user_b = $2, b_accepted_at = now(), lat = $3, lng = $4, updated_at = now()
       where id = $1 and user_b is null and status = 'pending' and expires_at > now() returning id`,
      [row.id, user.id, lat, lng],
    );
    if (claimed.length === 0)
      throw new HttpError(410, "this invite has ended. ask for a new one?");
    await query("delete from availability where user_id = $1", [user.id]);
    await finalize(row.id);
  } else if (row.status !== "accepted") {
    throw new HttpError(410, "this invite has ended. ask for a new one?");
  }
  return toMatch(
    (await one<MatchRow>(`${SELECT_MATCH} where m.id = $1`, [row.id]))!,
    user.id,
  );
}
