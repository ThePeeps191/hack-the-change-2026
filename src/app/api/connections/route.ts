// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import type { Connection } from "@/lib/contracts";
import { mockPartner, mockPartnerId } from "@/mocks/user";

// People I've connected with.
export async function GET() {
  const people: Connection[] = [{ user_id: mockPartnerId, ...mockPartner }];
  return ok(people);
}

// Opt in to stay in touch. Connected only when both people opt in.
export async function POST() {
  return ok({ connected: true });
}
