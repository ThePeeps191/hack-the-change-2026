// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { starterQuests } from "@/lib/starter-quests";

// ?type=anywhere for quests that work in any city.
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  return ok(type ? starterQuests().filter((q) => q.type === type) : starterQuests());
}
