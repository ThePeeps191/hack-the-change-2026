import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { acceptInvite } from "@/server/matching";

export const POST = authed<RouteContext<"/api/invites/[code]/accept">>(async (user, req, ctx) => {
  const { code } = await ctx.params;
  return ok(await acceptInvite(user, code, await body<{ lat: number; lng: number }>(req)));
});
