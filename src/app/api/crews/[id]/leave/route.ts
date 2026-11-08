import { noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { leaveCrew } from "@/server/crews";

export const POST = authed<RouteContext<"/api/crews/[id]/leave">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  await leaveCrew(user, id);
  return noContent();
});
