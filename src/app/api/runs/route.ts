// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, fail, ok } from "@/lib/http";
import { findStarterQuest } from "@/lib/starter-quests";
import { startRun } from "@/mocks/store";

// Crew and Claim runs only. Pair runs are created by the server and arrive on Match.run_id.
export async function POST(req: Request) {
  const { quest_id, crew_id, zone_id } = await body<{ quest_id: string; crew_id: string; zone_id: string }>(req);
  const quest = quest_id ? findStarterQuest(quest_id) : undefined;
  if (!quest) return fail("quest not found", 404);
  // A zone attempt or a quest without a crew is yours alone; a crew quest brings two crewmates.
  return ok(startRun(quest, zone_id ? "claim" : "crew", crew_id && !zone_id ? "crew" : "solo"));
}
