import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getRecap } from "@/server/recaps";

// The AI can take up to 30 s, sometimes after the response (after()). Vercel's
// default limit on some plans is 10 s, which would cut it off.
export const maxDuration = 60;

export const GET = authed<RouteContext<"/api/runs/[id]/recap">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getRecap(user, id));
});
