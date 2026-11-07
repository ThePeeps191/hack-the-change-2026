import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { declineMatch } from "@/server/matching";

export const POST = authed<RouteContext<"/api/matches/[id]/decline">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await declineMatch(user, id));
});
