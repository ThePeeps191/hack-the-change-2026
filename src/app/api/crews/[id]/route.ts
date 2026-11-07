import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getCrew } from "@/server/crews";

export const GET = authed<RouteContext<"/api/crews/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getCrew(user, id));
});
