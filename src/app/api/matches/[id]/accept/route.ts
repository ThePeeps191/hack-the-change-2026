import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { acceptMatch } from "@/server/matching";

export const POST = authed<RouteContext<"/api/matches/[id]/accept">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await acceptMatch(user, id));
});
