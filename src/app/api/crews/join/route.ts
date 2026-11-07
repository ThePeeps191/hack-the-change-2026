// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { mockCrew } from "@/mocks/crews";

export async function POST() {
  return ok(mockCrew);
}
