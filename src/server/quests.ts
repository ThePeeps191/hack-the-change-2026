import "server-only";
import type { Prefs, Quest, QuestTag, QuestType } from "@/lib/contracts";
import { one, query, refreshStarterQuests } from "@/lib/db";
import { GEMINI_MODE } from "@/lib/env";
import { generateQuests } from "@/lib/gemini";
import { notFound } from "@/lib/route";
import { distanceM } from "./safety";

const GEMINI_TIMEOUT_MS = 25_000; // grounded calls are slow, so nobody waits on this directly
const ACCEPT_TIMEOUT_MS = 5000; // what two people tapping "yes" will wait for, if warming missed
const CACHE_HOURS = 6;
const CACHE_RADIUS_M = 1000;
// The System 1 demo quest: the TFDL book hunt.
const DEMO_PAIR_QUEST = "a1b2c3d4-0001-4000-8000-000000000001";

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

export async function listQuests(type: string | null) {
  await refreshStarterQuests();
  const rows = type
    ? await query<QuestRow>("select * from quests where type = $1 order by starter desc, id limit 200", [type])
    : await query<QuestRow>("select * from quests order by starter desc, id limit 200");
  return rows.map(toQuest);
}

export async function getQuest(id: string) {
  await refreshStarterQuests();
  const row = await one<QuestRow>("select * from quests where id = $1", [id]);
  if (!row) throw notFound("quest");
  return toQuest(row);
}

// Keeps what Gemini wrote, so runs and history can point at it.
export async function saveQuests(quests: Quest[], language?: string) {
  const translated = language && !language.startsWith("en") ? language : null;
  for (const q of quests) {
    await query(
      `insert into quests (id, title, description, type, lat, lng, radius_m, duration_min, proof, coins, place_name, sources, tags, language)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text::jsonb, $13::text::jsonb, $14)
       on conflict (id) do nothing`,
      [
        q.id, q.title, q.description, q.type, q.lat, q.lng, q.radius_m, q.duration_min, q.proof, q.coins, q.place_name,
        JSON.stringify(q.sources ?? []), JSON.stringify(q.tags ?? []), translated,
      ],
    );
  }
}

function withTimeout<T>(work: Promise<T>, ms: number) {
  return Promise.race([
    work,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms)),
  ]);
}

async function starterNear(lat: number, lng: number) {
  const rows = await query<QuestRow>("select * from quests where starter order by id");
  const far = 1e9;
  const away = (q: QuestRow) => (q.lat == null || q.lng == null ? far : distanceM({ lat, lng }, { lat: q.lat, lng: q.lng }));
  return rows.map(toQuest).sort((a, b) => away(a as QuestRow) - away(b as QuestRow));
}

// Gemini first, and the starter pack if it's slow, down or returns nothing, so
// nobody ever gets an empty screen.
export async function questsNear(
  lat: number,
  lng: number,
  count: number,
  request: { prefs?: Prefs; prefer_tags?: QuestTag[] } = {},
  { timeoutMs = GEMINI_TIMEOUT_MS, enough = count } = {},
) {
  const cached = await recentlyWritten(lat, lng, request);
  if (cached.length >= enough) return cached.slice(0, count);
  try {
    const quests = await withTimeout(generateQuests(lat, lng, count, request), timeoutMs);
    if (quests.length > 0) {
      await saveQuests(quests, request.prefs?.language);
      return quests;
    }
  } catch (e) {
    console.error("quest generation fell back to the starter pack:", (e as Error).message);
  }
  return (await starterNear(lat, lng)).slice(0, count);
}

const warming = new Set<string>();

// Called the moment someone says they're free. Gemini writes quests while they
// wait to be matched, so a fresh one is ready when both say yes. One call per
// area at a time, and it's fine if it finishes after they've been paired.
export async function warmQuests(lat: number, lng: number, prefs: Prefs) {
  if (GEMINI_MODE === "mock") return;
  const area = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (warming.has(area)) return;
  warming.add(area);
  try {
    await questsNear(lat, lng, 5, { prefs, prefer_tags: tagsFor([prefs]) }, { enough: 3 });
  } finally {
    warming.delete(area);
  }
}

// What Gemini wrote for this area in the last few hours. This is what keeps the
// cost per quest low: one call serves everyone nearby. Translated quests aren't
// reused, so nobody gets someone else's language.
async function recentlyWritten(lat: number, lng: number, request: { prefs?: Prefs; prefer_tags?: QuestTag[] }) {
  const language = request.prefs?.language;
  if (GEMINI_MODE === "mock" || (language && !language.startsWith("en"))) return [];
  const rows = await query<QuestRow>(
    "select * from quests where not starter and language is null and lat is not null and created_at > now() - make_interval(hours => $1) order by created_at desc limit 100",
    [CACHE_HOURS],
  );
  return rows.filter((q) => distanceM({ lat, lng }, { lat: q.lat!, lng: q.lng! }) <= CACHE_RADIUS_M).map(toQuest);
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
  const language = prefs.find((p) => p.language)?.language;
  if (GEMINI_MODE === "mock" && wanted.length === 0) return getQuest(DEMO_PAIR_QUEST);
  const quests = await questsNear(lat, lng, 5, { prefs: { language }, prefer_tags: wanted }, { timeoutMs: ACCEPT_TIMEOUT_MS, enough: 1 });
  return chooseForPair(quests, wanted, prefs) ?? getQuest(DEMO_PAIR_QUEST);
}

export const isQuestType = (t: string | null): t is QuestType => t === "local" || t === "anywhere" || t === "event";
