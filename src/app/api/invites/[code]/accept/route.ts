// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { acceptInvite } from "@/mocks/store";

export async function POST() {
  return ok(acceptInvite());
}
