import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { attemptZone } from "@/server/games";

export const POST = authed<RouteContext<"/api/games/[id]/zones/[zone_id]/attempts">>(async (user, req, ctx) => {
  const { id, zone_id } = await ctx.params;
  return ok(await attemptZone(user, id, zone_id, await body<{ run_id: string; result: number }>(req)));
});
