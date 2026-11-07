// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { fail, ok } from "@/lib/http";
import { respond } from "@/mocks/store";

export async function POST(_req: Request, ctx: RouteContext<"/api/matches/[id]/decline">) {
  const { id } = await ctx.params;
  const match = respond(id, false);
  return match ? ok(match) : fail("match not found", 404);
}
