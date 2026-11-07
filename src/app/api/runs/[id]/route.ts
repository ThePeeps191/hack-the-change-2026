// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { fail, ok } from "@/lib/http";
import { getRun } from "@/mocks/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/runs/[id]">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  return run ? ok(run) : fail("run not found", 404);
}
