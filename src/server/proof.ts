import "server-only";
import type { User, Verdict } from "@/lib/contracts";
import { one, query } from "@/lib/db";
import { DEMO_MODE, AI_MODE } from "@/lib/env";
import { judgeProof } from "@/lib/ai";
import { HttpError, notFound } from "@/lib/route";
import { framesPath, isAllowedMedia, MAX_UPLOAD_BYTES, saveFrames, saveUpload, uploadPath } from "@/lib/uploads";
import { advance, applyVerdict, questForRun, runForMember } from "./runs";
import { distanceM, safetyRulesOn } from "./safety";

const GPS_SLACK_M = 50; // phones are rarely more accurate than this indoors
const WINDOW_SLACK_MS = 2 * 60_000;
// Under STUCK_VERDICT_MS (runs.ts), so a slow AI answer isn't beaten by the rescue.
const AI_TIMEOUT_MS = 18_000;

type SubmissionRow = {
  id: string;
  run_id: string;
  user_id: string;
  media_path: string | null;
  media_type: string | null;
  lat: number | null;
  lng: number | null;
  taken_at: Date | null;
  mock_verdict: string | null;
};

const num = (v: FormDataEntryValue | null) => {
  const n = typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

// Saves the proof and returns a pending verdict straight away, so the phone
// isn't held open while the AI looks. Run judgeSubmission afterwards, with after().
export async function submitProof(user: User, runId: string, form: FormData): Promise<{ verdict: Verdict; submissionId: string | null }> {
  const run = await advance(await runForMember(user, runId));
  const quest = await questForRun(run);

  const approved = await one("select 1 as yes from submissions where run_id = $1 and user_id = $2 and verdict = 'approved'", [runId, user.id]);
  if (approved) return { verdict: { status: "approved", reason: "this one was already checked. The coins are yours.", coins: quest.coins }, submissionId: null };
  if (run.status !== "active") throw new HttpError(409, "this quest has ended.");

  const media = form.get("media");
  const file = media instanceof File && media.size > 0 ? media : null;
  if (quest.proof !== "gps") {
    if (!file) throw new HttpError(400, `add a ${quest.proof} first.`);
    if (!isAllowedMedia(file.type)) throw new HttpError(415, "that file type won't open here. try a normal photo or video.");
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "that file's too big. try a shorter clip?");
  }

  const id = crypto.randomUUID();
  const path = file && isAllowedMedia(file.type) ? await saveUpload(id, file) : null;
  const frames = form.get("frames");
  if (path && file?.type.startsWith("video/") && frames instanceof File && frames.type === "image/jpeg" && frames.size > 0 && frames.size < 1024 * 1024) {
    await saveFrames(path, frames);
  }
  const takenAt = form.get("taken_at");
  await query(
    `insert into submissions (id, run_id, user_id, media_url, media_path, media_type, lat, lng, taken_at, mock_verdict)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10)`,
    [
      id, runId, user.id, path ? `/api/media/${id}` : null, path, file?.type ?? null, num(form.get("lat")), num(form.get("lng")),
      typeof takenAt === "string" && !Number.isNaN(Date.parse(takenAt)) ? takenAt : null,
      AI_MODE === "mock" && form.get("mock_verdict") === "rejected" ? "rejected" : null,
    ],
  );
  return { verdict: { status: "pending", reason: "" }, submissionId: id };
}

// Location and time first, because they're free and can't be argued with. Then
// the AI looks at the media. If the AI is down, the quest still counts: nobody
// should lose a real walk to our outage, and the reason says what happened.
export async function judgeSubmission(id: string) {
  const sub = await one<SubmissionRow>("select * from submissions where id = $1", [id]);
  if (!sub) return;
  const run = await one<{ id: string; quest_id: string; started_at: Date; ends_at: Date }>("select * from quest_runs where id = $1", [sub.run_id]);
  if (!run) return;
  const quest = await questForRun(run as never);

  if (safetyRulesOn()) {
    const problem = checkPlaceAndTime(sub, quest, run);
    if (problem) return applyVerdict(id, "rejected", problem);
  }

  try {
    const verdict = await Promise.race([
      judgeProof({
        quest,
        media_path: sub.media_path ? await uploadPath(sub.media_path) : null,
        media_type: sub.media_type,
        frames_path: sub.media_path && sub.media_type?.startsWith("video/") ? await framesPath(sub.media_path) : null,
        lat: sub.lat,
        lng: sub.lng,
        taken_at: sub.taken_at?.toISOString() ?? null,
        mock_verdict: sub.mock_verdict,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), AI_TIMEOUT_MS)),
    ]);
    await applyVerdict(id, verdict.status === "rejected" ? "rejected" : "approved", verdict.reason);
  } catch (e) {
    console.error("proof check failed:", (e as Error).message);
    await applyVerdict(id, "approved", "we couldn't check this one automatically, so it counts.");
  }
}

function checkPlaceAndTime(
  sub: SubmissionRow,
  quest: { lat: number | null; lng: number | null; radius_m: number | null; place_name: string | null },
  run: { started_at: Date; ends_at: Date },
) {
  if (sub.taken_at) {
    const t = sub.taken_at.getTime();
    if (t < run.started_at.getTime() - WINDOW_SLACK_MS || t > run.ends_at.getTime() + WINDOW_SLACK_MS) {
      return "this looks like it was taken outside the quest's time. got one from just now?";
    }
  }
  if (quest.lat != null && quest.lng != null && sub.lat != null && sub.lng != null) {
    const away = distanceM({ lat: sub.lat, lng: sub.lng }, { lat: quest.lat, lng: quest.lng });
    if (away > (quest.radius_m ?? 100) + GPS_SLACK_M) {
      return `you look about ${Math.round(away)} m from ${quest.place_name ?? "the spot"}. head a little closer and try again?`;
    }
  }
  return null;
}

// Demo safety net ("Count it anyway"): counts your own latest proof if the AI
// got it wrong. Only "Try the demo" guests can call it (see the route).
export async function approveByHand(user: User, runId: string) {
  if (!DEMO_MODE) throw notFound("route");
  await runForMember(user, runId);
  // A wrong "no" from the AI can be overturned too: your latest rejected proof
  // goes back to pending, then gets approved like any other.
  await query(
    `update submissions set verdict = 'pending' where id = (
       select id from submissions where run_id = $1 and user_id = $2 order by created_at desc limit 1
     ) and verdict = 'rejected'`,
    [runId, user.id],
  );
  const pending = await query<{ id: string }>("select id from submissions where run_id = $1 and user_id = $2 and verdict = 'pending'", [runId, user.id]);
  for (const s of pending) await applyVerdict(s.id, "approved", "counted by hand for the demo.");
  return pending.length;
}
