// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, fail, ok } from "@/lib/http";
import { mockGame } from "@/mocks/claim";

export async function POST(req: Request, ctx: RouteContext<"/api/games/[id]/zones/[zone_id]/attempts">) {
  const { zone_id } = await ctx.params;
  const zone = mockGame.zones.find((z) => z.id === zone_id);
  if (!zone) return fail("zone not found", 404);
  const { result } = await body<{ run_id: string; result: number }>(req);
  return ok({ ...zone, held_by_team_id: mockGame.teams[0].id, best_result: result ?? zone.best_result });
}
