// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { generateQuests } from "@/lib/gemini";
import { body, fail, ok } from "@/lib/http";

export async function POST(req: Request) {
  const { lat, lng, count } = await body<{ lat: number; lng: number; count: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  return ok(await generateQuests(lat, lng, count ?? 3));
}
