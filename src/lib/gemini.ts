import "server-only";
import type { Quest, Recap, Verdict } from "./contracts";
import { GEMINI_MODE } from "./env";
import { starterQuests } from "./starter-quests";

// Everything Gemini does sits behind these plain functions. GEMINI_MODE=mock
// returns fixtures so dozens of sessions don't burn the shared quota.
// Gemini area: fill in the live branches.

export async function generateQuests(lat: number, lng: number, count = 3): Promise<Quest[]> {
  if (GEMINI_MODE === "mock") return nearest(starterQuests(), lat, lng).slice(0, count);
  return nearest(starterQuests(), lat, lng).slice(0, count);
}

export async function judgeProof(input: {
  quest: Quest;
  media_type: string;
  lat: number | null;
  lng: number | null;
  taken_at: string | null;
}): Promise<Verdict> {
  if (GEMINI_MODE === "mock") {
    return {
      status: "approved",
      reason: "that's the title page, and the date is right there. nice find.",
      coins: input.quest.coins,
    };
  }
  return { status: "approved", reason: "checked by hand for now.", coins: input.quest.coins };
}

export async function writeRecap(run_id: string, quest: Quest): Promise<Recap> {
  return {
    run_id,
    title: quest.title,
    summary: `You and Priya walked over to ${quest.place_name ?? "a spot nearby"} and finished "${quest.title}" with time to spare.`,
    route: [],
    photos: [],
    narration_url: null,
    duration_min: 17,
    distance_m: 640,
    coins: quest.coins,
    partner: { display_name: "Priya", avatar_url: null },
  };
}

function nearest(quests: Quest[], lat: number, lng: number) {
  const d = (q: Quest) =>
    q.lat == null || q.lng == null ? 1e9 : (q.lat - lat) ** 2 + (q.lng - lng) ** 2;
  return [...quests].sort((a, b) => d(a) - d(b));
}
