// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { noContent } from "@/lib/http";

// Batch of pings: { run_id, points }. Location is personal data: never log it.
export async function POST() {
  return noContent();
}
