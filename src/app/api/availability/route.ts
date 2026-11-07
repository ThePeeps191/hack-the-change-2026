// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, fail, noContent, ok } from "@/lib/http";
import { setFree } from "@/mocks/store";

export async function POST(req: Request) {
  const { lat, lng } = await body<{ lat: number; lng: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  setFree(true);
  return ok({ expires_at: new Date(Date.now() + 20 * 60_000).toISOString() });
}

export async function DELETE() {
  setFree(false);
  return noContent();
}
