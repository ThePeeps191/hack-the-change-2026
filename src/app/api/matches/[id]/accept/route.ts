import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { acceptMatch } from "@/server/matching";

// The AI can take up to 30 s, sometimes after the response (after()). Vercel's
// default limit on some plans is 10 s, which would cut it off.
export const maxDuration = 60;

export const POST = authed<RouteContext<"/api/matches/[id]/accept">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await acceptMatch(user, id));
});
