import "server-only";

// Real, named, public places near a point, from OpenStreetMap (free, no key).
// This is what keeps AI-written quests at real spots: the model picks from this
// list, and the coordinates always come from here, never from the model.
// © OpenStreetMap contributors, ODbL. Quests link back to each place.

export type Place = {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  metres: number;
  opening_hours: string | null;
  url: string;
};

const OVERPASS_URL = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const RADIUS_M = 900;
const MAX_PLACES = 30;
const CACHE_MS = 60 * 60_000;
const TIMEOUT_MS = 8000;

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

export async function placesNear(lat: number, lng: number): Promise<Place[]> {
  // Rounded to about 100 m before it leaves our server: enough to find places,
  // not enough to pinpoint anyone. Also the cache key.
  const at = { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
  const key = `${at.lat},${at.lng}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;

  const around = `(around:${RADIUS_M},${at.lat},${at.lng})`;
  const query = `[out:json][timeout:8];(${FILTERS.map((f) => `nwr${around}${f}["name"];`).join("")});out center 120;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "Amble/0.1 (hackathon project)" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenStreetMap answered ${res.status}`);
  const { elements = [] } = (await res.json()) as { elements?: Element[] };

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
