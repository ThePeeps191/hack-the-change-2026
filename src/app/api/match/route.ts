// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { currentMatch } from "@/mocks/store";

// Polled by the client. null means still searching (or not free).
export async function GET() {
  return ok(currentMatch());
}
