// Saves real, public OpenStreetMap places around campus and our quest areas to
// data/places/calgary.json. The app asks Overpass live first, but Overpass is
// often overloaded, and then this snapshot keeps AI quests at real places.
// Uses Photon (photon.komoot.io), a free OpenStreetMap search. Run it by hand:
//   bun scripts/snapshot-places.ts
// © OpenStreetMap contributors, ODbL.
import { mkdirSync, writeFileSync } from "node:fs";

const CENTRES: [string, number, number][] = [
  ["UCalgary main campus", 51.0786, -114.1302],
  ["UCalgary south campus", 51.0705, -114.1300],
  ["Downtown core", 51.0447, -114.0660],
  ["Chinatown and Prince's Island", 51.0535, -114.0660],
  ["Kensington", 51.0527, -114.0870],
  ["East Village", 51.0450, -114.0530],
  ["Inglewood", 51.0380, -114.0200],
];
const RADIUS_KM = 1.2;

// The same kinds of place as src/lib/places.ts asks Overpass for, minus
// playgrounds: quests never involve children.
const TAGS = [
  "amenity:library", "amenity:cafe", "amenity:ice_cream", "amenity:marketplace", "amenity:arts_centre",
  "amenity:community_centre", "amenity:food_court", "amenity:fountain", "amenity:townhall",
  "leisure:park", "leisure:garden", "leisure:sports_centre", "leisure:track", "leisure:dog_park", "leisure:nature_reserve",
  "tourism:artwork", "tourism:viewpoint", "tourism:museum", "tourism:gallery", "tourism:attraction",
  "shop:books", "shop:bakery", "shop:gift", "shop:music", "shop:second_hand", "shop:stationery",
  "historic",
];
const TYPES: Record<string, string> = { N: "node", W: "way", R: "relation" };

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; osm_key?: string; osm_value?: string; osm_type?: string; osm_id?: number };
};

const places = new Map<string, { name: string; kind: string; lat: number; lng: number; url: string }>();
for (const [area, lat, lng] of CENTRES) {
  let found = 0;
  for (const tag of TAGS) {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&radius=${RADIUS_KM}&limit=50&osm_tag=${tag}`;
    const res = await fetch(url, { headers: { "user-agent": "Amble/0.1 (hackathon project)" } }).catch(() => null);
    if (!res?.ok) {
      console.error(`skipped ${tag} near ${area}: ${res?.status ?? "no answer"}`);
      continue;
    }
    for (const f of ((await res.json()) as { features: Feature[] }).features) {
      const p = f.properties;
      const name = p.name?.trim();
      if (!name || !p.osm_type || !p.osm_id) continue;
      const key = name.toLowerCase();
      if (places.has(key)) continue;
      const [x, y] = f.geometry.coordinates;
      const kind = p.osm_key === "shop" ? `${p.osm_value} shop` : p.osm_key === "historic" ? `historic ${p.osm_value}` : (p.osm_value ?? "place");
      places.set(key, {
        name,
        kind: kind.replace(/_/g, " "),
        lat: Math.round(y * 1e6) / 1e6,
        lng: Math.round(x * 1e6) / 1e6,
        url: `https://www.openstreetmap.org/${TYPES[p.osm_type] ?? "node"}/${p.osm_id}`,
      });
      found++;
    }
    await new Promise((r) => setTimeout(r, 150)); // be gentle with a free service
  }
  console.log(`${area}: ${found} new places`);
}

mkdirSync("data/places", { recursive: true });
const sorted = [...places.values()].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync("data/places/calgary.json", `${JSON.stringify(sorted, null, 1)}\n`);
console.log(`saved ${sorted.length} places to data/places/calgary.json`);
