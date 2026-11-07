import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getRun } from "@/server/runs";

export const GET = authed<RouteContext<"/api/runs/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getRun(user, id));
});
