// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";

// Opt in to stay in touch. Connected only when both people opt in.
export async function POST() {
  return ok({ connected: true });
}
