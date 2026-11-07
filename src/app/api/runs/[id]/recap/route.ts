import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getRecap } from "@/server/recaps";

export const GET = authed<RouteContext<"/api/runs/[id]/recap">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getRecap(user, id));
});
