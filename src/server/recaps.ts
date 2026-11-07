import "server-only";
import type { Partner, Recap, User } from "@/lib/contracts";
import { one, query } from "@/lib/db";
import { writeRecap } from "@/lib/gemini";
import { HttpError } from "@/lib/route";
import { uploadPath } from "@/lib/uploads";
import { timesTogether } from "./matching";
import { advance, questForRun, runForMember } from "./runs";

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
  const photos = await query<{ media_url: string; media_path: string; media_type: string }>(
    `select media_url, media_path, media_type from submissions
     where run_id = $1 and verdict = 'approved' and media_path is not null order by created_at`,
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
      photos: photos.map((p) => ({ path: uploadPath(p.media_path), type: p.media_type })),
    });
    await query("insert into recaps (run_id, summary, narration_url) values ($1, $2, $3) on conflict (run_id) do nothing", [runId, saved.summary, saved.narration_url]);
  }

  const other = run.mode === "pair" ? people.find((p) => p.user_id !== user.id) : undefined;
  const partner: Partner | null = other ? { display_name: other.display_name, avatar_url: other.avatar_url } : null;
  const earned = await one<{ amount: number }>("select amount from coin_events where run_id = $1 and user_id = $2", [runId, user.id]);

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
  };
}
