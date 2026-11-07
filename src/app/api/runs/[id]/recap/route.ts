// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { writeRecap } from "@/lib/gemini";
import { fail, ok } from "@/lib/http";
import { getRun } from "@/mocks/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/runs/[id]/recap">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return fail("run not found", 404);
  return ok(await writeRecap(id, run.quest));
}
