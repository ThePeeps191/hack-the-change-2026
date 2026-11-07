import type { Quest, QuestTag, Source } from "./contracts";

// What every AI provider's quests must satisfy. The prompts ask nicely, and
// toSafeQuest is what's enforced, whichever model wrote the quest.

const MAX_DISTANCE_M = 5000;

export const QUEST_RULES = `You write short real-world quests for Amble, an app that gets two people, often strangers, outside together.

Every quest must:
- be doable by two people in 20 minutes or less, at walking pace, with no fitness level assumed
- happen in a real, public place that is open right now, in daylight
- give the two people a shared task, so they have something to do other than small talk
- be provable with one photo or a short video
- cost nothing, or very little, and never need alcohol
- stay legal, respectful and safe: no private property, no filming strangers, no roads or heights, nothing risky or embarrassing

Write in a warm, plain, low-pressure voice. Titles are short and lowercase.`;

export const VALID_TAGS: QuestTag[] = ["newcomer", "give-back", "skill-swap", "calm", "step-free", "side-by-side", "daytime"];

export function localTime() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", weekday: "long", hour: "numeric", minute: "2-digit" }).format(new Date());
}

// Grounded answers can't use a response schema, so the model is asked for JSON
// and this finds the array in whatever comes back.
export function parseJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("no JSON array in the reply");
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("reply wasn't an array");
  return parsed;
}

const BLOCKED = /\b(alcohol|beer|wine|bar crawl|shots?|drunk|weed|cannabis|drugs?|knife|weapon|trespass|rooftop|climb|night|midnight|naked|nude|strip|kiss|gamble|casino)\b/i;

const metres = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const rad = Math.PI / 180;
  const x = (bLng - aLng) * rad * Math.cos(((aLat + bLat) / 2) * rad);
  const y = (bLat - aLat) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
};

// The check on what comes back. Prompts ask nicely; this is what's enforced.
export function toSafeQuest(raw: unknown, near: { lat: number; lng: number }, sources: Source[]): Quest | null {
  const q = raw as Partial<Quest>;
  if (typeof q?.title !== "string" || typeof q.description !== "string" || !q.title.trim() || !q.description.trim()) return null;
  if (BLOCKED.test(`${q.title} ${q.description}`)) return null;
  if (typeof q.lat !== "number" || typeof q.lng !== "number") return null;
  if (metres(near.lat, near.lng, q.lat, q.lng) > MAX_DISTANCE_M) return null;
  const minutes = typeof q.duration_min === "number" ? Math.round(q.duration_min) : 20;
  if (minutes < 5 || minutes > 20) return null;
  return {
    id: crypto.randomUUID(),
    title: q.title.trim().slice(0, 80),
    description: q.description.trim().slice(0, 400),
    type: q.type === "event" ? "event" : "local",
    lat: q.lat,
    lng: q.lng,
    radius_m: typeof q.radius_m === "number" ? Math.min(Math.max(Math.round(q.radius_m), 40), 300) : 100,
    duration_min: minutes,
    proof: q.proof === "video" ? "video" : "photo",
    coins: Math.min(Math.max(typeof q.coins === "number" ? Math.round(q.coins) : 25, 10), 50),
    place_name: typeof q.place_name === "string" ? q.place_name.trim().slice(0, 80) : null,
    sources,
    tags: Array.isArray(q.tags) ? q.tags.filter((t) => VALID_TAGS.includes(t as QuestTag)) : [],
  };
}
