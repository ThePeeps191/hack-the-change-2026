// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { mockDashboard } from "@/mocks/dashboard";

export async function GET() {
  return ok(mockDashboard());
}
