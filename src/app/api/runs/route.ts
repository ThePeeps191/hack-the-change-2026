// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, fail, ok } from "@/lib/http";
import { findStarterQuest, starterQuests } from "@/lib/starter-quests";
import { startRun } from "@/mocks/store";

export async function POST(req: Request) {
  const { quest_id, crew_id, zone_id } = await body<{ quest_id: string; match_id: string; crew_id: string; zone_id: string }>(req);
  const quest = quest_id ? findStarterQuest(quest_id) : starterQuests()[0];
  if (!quest) return fail("quest not found", 404);
  return ok(startRun(quest, zone_id ? "claim" : crew_id ? "crew" : "pair"));
}
