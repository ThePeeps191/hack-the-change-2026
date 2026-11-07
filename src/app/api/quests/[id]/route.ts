// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { fail, ok } from "@/lib/http";
import { findStarterQuest } from "@/lib/starter-quests";

export async function GET(_req: Request, ctx: RouteContext<"/api/quests/[id]">) {
  const { id } = await ctx.params;
  const quest = findStarterQuest(id);
  return quest ? ok(quest) : fail("quest not found", 404);
}
