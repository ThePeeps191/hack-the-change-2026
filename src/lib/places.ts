import "server-only";
import snapshot from "../../data/places/calgary.json";
import { starterQuests } from "./starter-quests";

// Real, named, public places near a point. This is what keeps AI-written quests
// at real spots: the model picks from this list, and the coordinates always come
// from here, never from the model.
//
// 1. OpenStreetMap, through the Overpass API (free, no key). Overpass is often
//    overloaded, so a few mirrors are tried with short timeouts, and a failure
//    is remembered for a few minutes so nobody waits on it twice.
//    If none answers in a few seconds, a saved snapshot of the same kinds of
//    place around campus and central Calgary (data/places/calgary.json, made by
//    scripts/snapshot-places.ts) stands in.
// 2. Our own curated places from data/quests/, which are always there.
// © OpenStreetMap contributors, ODbL. Quests link back to each OSM place.

export type Place = {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  metres: number;
  opening_hours: string | null;
  url: string | null;
};

const MIRRORS = process.env.OVERPASS_URL
  ? [process.env.OVERPASS_URL]
  : ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const RADIUS_M = 900;
const CURATED_RADIUS_M = 3000;
const MAX_PLACES = 30;
const CACHE_MS = 60 * 60_000;
const FAILURE_MS = 5 * 60_000;
const TIMEOUT_MS = 3500; // mirrors are asked at the same time, so this is the whole wait

// Public spots two people can walk into and do something together. No bars,
// no private buildings, nothing that needs a ticket.
const FILTERS = [
  '["amenity"~"^(library|cafe|ice_cream|marketplace|arts_centre|community_centre|food_court|fountain|townhall)$"]',
  '["leisure"~"^(park|garden|playground|sports_centre|pitch|track|dog_park|nature_reserve)$"]',
  '["tourism"~"^(artwork|viewpoint|museum|gallery|attraction|information)$"]',
  '["shop"~"^(books|bakery|convenience|gift|music|second_hand|stationery)$"]',
  '["historic"]',
];

type Element = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const cache = new Map<string, { at: number; places: Place[] }>();
let overpassDownSince = 0;

function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.round(Math.sqrt(x * x + y * y) * 6371000);
}

function kindOf(tags: Record<string, string>) {
  if (tags.amenity) return tags.amenity.replace(/_/g, " ");
  if (tags.leisure) return tags.leisure.replace(/_/g, " ");
  if (tags.tourism) return tags.tourism.replace(/_/g, " ");
  if (tags.shop) return `${tags.shop.replace(/_/g, " ")} shop`;
  if (tags.historic) return `historic ${tags.historic.replace(/_/g, " ")}`;
  return "place";
}

// OpenStreetMap places, plus our curated ones, nearest first. Empty only when
// both have nothing near this point.
export async function placesNear(lat: number, lng: number): Promise<Place[]> {
  const fromOsm = await osmPlaces(lat, lng).catch((e) => {
    console.error("Overpass unavailable, using the saved OpenStreetMap snapshot:", (e as Error).message);
    return snapshotPlaces(lat, lng);
  });
  const names = new Set(fromOsm.map((p) => p.name.toLowerCase()));
  const merged = [...fromOsm, ...curatedPlaces(lat, lng).filter((p) => !names.has(p.name.toLowerCase()))];
  return merged.sort((a, b) => a.metres - b.metres).slice(0, MAX_PLACES);
}

// The saved snapshot, within the same walking radius as a live lookup.
function snapshotPlaces(lat: number, lng: number): Place[] {
  return snapshot
    .map((p) => ({ ...p, metres: metres({ lat, lng }, p), opening_hours: null }))
    .filter((p) => p.metres <= RADIUS_M);
}

// The places our hand-written quests use, which we know are real and public.
function curatedPlaces(lat: number, lng: number): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const q of starterQuests()) {
    if (!q.place_name || q.lat == null || q.lng == null || seen.has(q.place_name)) continue;
    seen.add(q.place_name);
    const away = metres({ lat, lng }, { lat: q.lat, lng: q.lng });
    if (away <= CURATED_RADIUS_M) out.push({ name: q.place_name, kind: "campus spot", lat: q.lat, lng: q.lng, metres: away, opening_hours: null, url: null });
  }
  return out;
}

async function osmPlaces(lat: number, lng: number): Promise<Place[]> {
  // Rounded to about 100 m before it leaves our server: enough to find places,
  // not enough to pinpoint anyone. Also the cache key.
  const at = { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
  const key = `${at.lat},${at.lng}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;
  if (Date.now() - overpassDownSince < FAILURE_MS) throw new Error("Overpass was down a moment ago");

  const around = `(around:${RADIUS_M},${at.lat},${at.lng})`;
  const query = `[out:json][timeout:5];(${FILTERS.map((f) => `nwr${around}${f}["name"];`).join("")});out center 120;`;
  // Every mirror at once; the first good answer wins.
  const ask = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "Amble/0.1 (hackathon project)" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return ((await res.json()) as { elements?: Element[] }).elements ?? [];
  };
  const elements = await Promise.any(MIRRORS.map(ask)).catch(() => null);
  if (!elements) {
    overpassDownSince = Date.now();
    throw new Error("every Overpass mirror failed or timed out");
  }

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const e of elements) {
    const point = e.lat != null && e.lon != null ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;
    const name = e.tags?.name?.trim();
    if (!point || !name || seen.has(name.toLowerCase())) continue;
    if (e.tags?.access === "private" || e.tags?.access === "no") continue;
    seen.add(name.toLowerCase());
    places.push({
      name,
      kind: kindOf(e.tags ?? {}),
      ...point,
      metres: metres(at, point),
      opening_hours: e.tags?.opening_hours ?? null,
      url: `https://www.openstreetmap.org/${e.type}/${e.id}`,
    });
  }
  places.sort((a, b) => a.metres - b.metres);
  const nearest = places.slice(0, MAX_PLACES);
  cache.set(key, { at: Date.now(), places: nearest });
  return nearest;
}
