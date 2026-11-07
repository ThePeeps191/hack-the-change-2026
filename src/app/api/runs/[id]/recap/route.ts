// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { writeRecap } from "@/lib/gemini";
import { fail, ok } from "@/lib/http";
import { getRun } from "@/mocks/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/runs/[id]/recap">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return fail("run not found", 404);
  const recap = await writeRecap(id, run.quest);
  // Mock: only pair runs have a stranger to stay in touch with.
  if (run.mode !== "pair") {
    const names = run.members.slice(1).map((m) => m.display_name);
    return ok({
      ...recap,
      partner: null,
      summary: names.length
        ? `You, ${names.join(" and ")} finished "${run.quest.title}" together.`
        : `You finished "${run.quest.title}" on your own. That counts too.`,
    });
  }
  return ok(recap);
}
