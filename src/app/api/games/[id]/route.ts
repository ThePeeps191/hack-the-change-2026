import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getGame } from "@/server/games";

export const GET = authed<RouteContext<"/api/games/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getGame(user, id));
});
