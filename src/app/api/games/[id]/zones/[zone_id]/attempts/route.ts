// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, fail, ok } from "@/lib/http";
import { mockGame } from "@/mocks/claim";

export async function POST(req: Request, ctx: RouteContext<"/api/games/[id]/zones/[zone_id]/attempts">) {
  const { zone_id } = await ctx.params;
  const zone = mockGame.zones.find((z) => z.id === zone_id);
  if (!zone) return fail("zone not found", 404);
  const { result } = await body<{ run_id: string; result: number }>(req);
  // Mock: lower wins for a year (oldest book), higher wins for everything else.
  const beat =
    typeof result === "number" &&
    (zone.best_result == null || (zone.result_unit === "year" ? result < zone.best_result : result > zone.best_result));
  if (beat) {
    zone.held_by_team_id = mockGame.teams[0].id;
    zone.best_result = result;
  }
  return ok({ ...zone });
}
