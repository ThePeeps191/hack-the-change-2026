import "server-only";
import type { Partner, Recap, User } from "@/lib/contracts";
import { one, query } from "@/lib/db";
import { writeRecap } from "@/lib/ai";
import { HttpError } from "@/lib/route";
import { uploadPath } from "@/lib/uploads";
import { botId } from "./bot";
import { timesTogether } from "./matching";
import { advance, questForRun, runForMember } from "./runs";

// Writes the recap's words ahead of time (see GET /api/runs/:id), once per
// server, so opening the recap is instant. Failing here is fine: opening the
// recap tries again.
const prewriting = new Set<string>();
export async function prewriteRecap(user: User, runId: string) {
  if (prewriting.has(runId)) return;
  prewriting.add(runId);
  try {
    if (await one("select 1 as yes from recaps where run_id = $1", [runId])) return;
    await getRecap(user, runId);
  } catch (e) {
    console.error("recap prewrite failed:", (e as Error).message);
  } finally {
    prewriting.delete(runId);
  }
}

// The words are written once per run and kept. The route is only ever yours:
// a recap never shows where your partner walked.
export async function getRecap(user: User, runId: string): Promise<Recap> {
  const run = await advance(await runForMember(user, runId));
  if (run.status !== "completed") throw new HttpError(404, "recap isn't ready yet");
  const quest = await questForRun(run);

  const people = await query<{ user_id: string; display_name: string; avatar_url: string | null; distance_m: number | null }>(
    `select m.user_id, u.display_name, u.avatar_url, m.distance_m from run_members m
     join users u on u.id = m.user_id where m.run_id = $1`,
    [runId],
  );
  // The practice partner's proof is a copy of yours, so it's left out: a judge
  // trying the demo alone would otherwise see their own photo twice.
  const photos = await query<{ media_url: string; media_path: string; media_type: string }>(
    `select s.media_url, s.media_path, s.media_type from submissions s join users u on u.id = s.user_id
     where s.run_id = $1 and s.verdict = 'approved' and s.media_path is not null and not u.is_bot order by s.created_at`,
    [runId],
  );
  const route = await query<{ lat: number; lng: number; time: Date }>(
    "select lat, lng, time from location_pings where run_id = $1 and user_id = $2 order by time",
    [runId, user.id],
  );

  const me = people.find((p) => p.user_id === user.id);
  const durationMin = Math.max(1, Math.round(((run.completed_at ?? run.ends_at).getTime() - run.started_at.getTime()) / 60_000));

  let saved = await one<{ summary: string; narration_url: string | null }>("select summary, narration_url from recaps where run_id = $1", [runId]);
  if (!saved) {
    saved = await writeRecap({
      quest,
      names: people.map((p) => p.display_name),
      duration_min: durationMin,
      distance_m: me?.distance_m ?? null,
      // A photo that can't be found is left out rather than losing the recap.
      photos: (
        await Promise.all(photos.map(async (p) => ({ path: await uploadPath(p.media_path).catch(() => ""), type: p.media_type })))
      ).filter((p) => p.path),
    });
    await query("insert into recaps (run_id, summary, narration_url) values ($1, $2, $3) on conflict (run_id) do nothing", [runId, saved.summary, saved.narration_url]);
    // If both of you opened it at once, everyone gets the words that were kept.
    saved = (await one<{ summary: string; narration_url: string | null }>("select summary, narration_url from recaps where run_id = $1", [runId])) ?? saved;
  }

  const other = run.mode === "pair" ? people.find((p) => p.user_id !== user.id) : undefined;
  const partner: Partner | null = other ? { display_name: other.display_name, avatar_url: other.avatar_url } : null;
  const earned = await one<{ amount: number }>("select amount from coin_events where run_id = $1 and user_id = $2", [runId, user.id]);
  const moods = await query<{ phase: "before" | "after"; mood: number }>("select phase, mood from checkins where run_id = $1 and user_id = $2", [runId, user.id]);
  const moodOf = (phase: "before" | "after") => moods.find((m) => m.phase === phase)?.mood ?? null;

  return {
    run_id: runId,
    summary: saved.summary,
    route: route.map((p) => ({ lat: p.lat, lng: p.lng, at: p.time.toISOString() })),
    photos: photos.map((p) => p.media_url),
    narration_url: saved.narration_url,
    title: quest.title,
    duration_min: durationMin,
    distance_m: me?.distance_m ?? undefined,
    coins: earned?.amount ?? 0,
    partner,
    times_together: other ? await timesTogether(user.id, other.user_id) : undefined,
    // Added: the partner is the practice bot, so the app doesn't treat her as an old friend.
    demo_partner: other ? other.user_id === (await botId()) : undefined,
    // Added: you two are already connected, so the recap says so instead of asking again.
    connected: other
      ? !!(await one("select 1 as yes from connections where (user_a = $1 and user_b = $2) or (user_a = $2 and user_b = $1)", [user.id, other.user_id]))
      : undefined,
    // Added: when it finished, so the "how do you feel now" question only shows on a fresh recap.
    completed_at: (run.completed_at ?? run.ends_at).toISOString(),
    proof: photos.map((p) => ({ url: p.media_url, type: p.media_type })),
    mood_before: moodOf("before"),
    mood_after: moodOf("after"),
  };
}
