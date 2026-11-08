import "server-only";
import type { Prefs, Quest, QuestTag, QuestType } from "@/lib/contracts";
import { one, query, refreshStarterQuests } from "@/lib/db";
import { AI_MODE } from "@/lib/env";
import { notFound } from "@/lib/route";
import { distanceM } from "./safety";

// The System 1 demo quest: ping pong at Schulich, on campus. Must be in data/quests/.
const DEMO_PAIR_QUEST = "48359d56-748a-4a9a-85b9-388c730a447c";

export type QuestRow = Quest;

export const toQuest = (r: QuestRow): Quest => ({
  id: r.id,
  title: r.title,
  description: r.description,
  type: r.type,
  lat: r.lat,
  lng: r.lng,
  radius_m: r.radius_m,
  duration_min: r.duration_min,
  proof: r.proof,
  coins: r.coins,
  place_name: r.place_name,
  sources: r.sources,
  tags: r.tags,
});

// Only the hand-made starter pack (data/quests/). The AI never writes quests:
// it only checks proof and writes recaps.
export async function listQuests(type: string | null) {
  await refreshStarterQuests();
  const rows = await query<QuestRow>(
    "select * from quests where starter and ($1::text is null or type = $1) order by id",
    [type],
  );
  return rows.map(toQuest);
}

export async function getQuest(id: string) {
  await refreshStarterQuests();
  const row = await one<QuestRow>("select * from quests where id = $1", [id]);
  if (!row) throw notFound("quest");
  return toQuest(row);
}

// The starter quests nearest a spot, closest first. Anywhere quests (no place) go last.
export async function questsNear(lat: number, lng: number, count: number) {
  await refreshStarterQuests();
  const rows = await query<QuestRow>("select * from quests where starter order by id");
  const far = 1e9;
  const away = (q: QuestRow) => (q.lat == null || q.lng == null ? far : distanceM({ lat, lng }, { lat: q.lat, lng: q.lng }));
  return rows.map(toQuest).sort((a, b) => away(a as QuestRow) - away(b as QuestRow)).slice(0, count);
}

// What the pair's comfort settings ask of a quest.
export function tagsFor(prefs: Prefs[]): QuestTag[] {
  const tags: QuestTag[] = [];
  if (prefs.some((p) => p.step_free)) tags.push("step-free");
  if (prefs.some((p) => p.social === "side-by-side")) tags.push("side-by-side");
  return tags;
}

// A stranger quest has to fit in 20 minutes and happen somewhere public, so it
// must have a place. The quest with the most wanted tags wins, nearest first.
export function chooseForPair(quests: Quest[], wanted: QuestTag[], prefs: Prefs[]) {
  const shortOnly = prefs.some((p) => p.pace === "short");
  const fits = quests.filter((q) => q.duration_min <= 20 && q.type !== "anywhere" && (!shortOnly || q.duration_min <= 15));
  const pool = fits.length ? fits : quests.filter((q) => q.duration_min <= 20);
  const score = (q: Quest) => wanted.filter((t) => q.tags?.includes(t)).length;
  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export async function pickPairQuest(lat: number, lng: number, prefs: Prefs[]): Promise<Quest> {
  const wanted = tagsFor(prefs);
  if (AI_MODE === "mock" && wanted.length === 0) return getQuest(DEMO_PAIR_QUEST);
  const quests = await questsNear(lat, lng, 5);
  return chooseForPair(quests, wanted, prefs) ?? getQuest(DEMO_PAIR_QUEST);
}

export const isQuestType = (t: string | null): t is QuestType => t === "local" || t === "anywhere" || t === "event";
