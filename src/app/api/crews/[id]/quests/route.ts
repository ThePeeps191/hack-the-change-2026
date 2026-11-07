// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { noContent } from "@/lib/http";

export async function POST() {
  return noContent();
}
