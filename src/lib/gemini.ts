import "server-only";
import type { Prefs, Quest, QuestTag, Verdict } from "./contracts";
import { GEMINI_MODE } from "./env";
import { starterQuests } from "./starter-quests";

// Everything Gemini does sits behind these plain functions. GEMINI_MODE=mock
// returns fixtures so dozens of sessions don't burn the shared quota, and the
// real calls are in gemini-live.ts. The server handles timeouts, failures (it
// falls back to the starter pack) and saving what comes back.

const live = () => import("./gemini-live");

export type QuestRequest = {
  // Comfort settings of everyone on the quest. Respect pace and social energy,
  // and write the text in `language` if it's set.
  prefs?: Prefs;
  // Tags the quest should have if it can, e.g. ["step-free", "side-by-side"].
  prefer_tags?: QuestTag[];
};

export async function generateQuests(lat: number, lng: number, count = 3, request: QuestRequest = {}): Promise<Quest[]> {
  if (GEMINI_MODE === "mock") return nearest(starterQuests(), lat, lng).slice(0, count);
  return (await live()).generateQuestsLive(lat, lng, count, request);
}

export type ProofInput = {
  quest: Quest;
  media_path: string | null; // the upload on disk; null for gps proof
  media_type: string | null;
  lat: number | null;
  lng: number | null;
  taken_at: string | null;
  mock_verdict?: string | null; // mock mode only: "rejected" shows the rejection state
};

// Location and time are checked before this runs (src/server/proof.ts), so this
// answers one question: does the media show the quest being done?
export async function judgeProof(input: ProofInput): Promise<Pick<Verdict, "status" | "reason">> {
  if (GEMINI_MODE === "mock") {
    await new Promise((r) => setTimeout(r, 2000));
    if (input.mock_verdict === "rejected") {
      return { status: "rejected", reason: "we can see a bookshelf, but not a title page. get a little closer to the first pages and try again?" };
    }
    return { status: "approved", reason: "that's the title page, and the date is right there. nice find." };
  }
  return (await live()).judgeProofLive(input);
}

export type RecapInput = {
  quest: Quest;
  names: string[]; // first names of everyone on the quest
  duration_min: number;
  distance_m: number | null;
  photos: { path: string; type: string }[]; // verified media on disk
};

// Only the words: the server adds the route, photos and stats around them.
export async function writeRecap(input: RecapInput): Promise<{ summary: string; narration_url: string | null }> {
  if (GEMINI_MODE === "live") {
    try {
      return { summary: await (await live()).writeRecapLive(input), narration_url: null };
    } catch (e) {
      console.error("recap fell back to the plain summary:", (e as Error).message);
    }
  }
  const who = input.names.length > 1 ? `${input.names.slice(0, -1).join(", ")} and ${input.names.at(-1)}` : (input.names[0] ?? "You");
  return {
    summary: `${who} made it to ${input.quest.place_name ?? "a spot nearby"} and finished "${input.quest.title}" with time to spare.`,
    narration_url: null,
  };
}

function nearest(quests: Quest[], lat: number, lng: number) {
  const d = (q: Quest) =>
    q.lat == null || q.lng == null ? 1e9 : (q.lat - lat) ** 2 + (q.lng - lng) ** 2;
  return [...quests].sort((a, b) => d(a) - d(b));
}
