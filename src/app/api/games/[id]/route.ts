// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { mockGame } from "@/mocks/claim";

export async function GET() {
  return ok(mockGame);
}
