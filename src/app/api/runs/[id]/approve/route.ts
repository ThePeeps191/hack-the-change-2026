import { ok } from "@/lib/http";
import { isDemoGuest } from "@/lib/auth";
import { authed, notFound } from "@/lib/route";
import { approveByHand } from "@/server/proof";

// "Try the demo" guests only: count your own proof if the AI gets it wrong.
export const POST = authed<RouteContext<"/api/runs/[id]/approve">>(async (user, _req, ctx) => {
  if (!(await isDemoGuest())) throw notFound("route");
  const { id } = await ctx.params;
  return ok({ approved: await approveByHand(user, id) });
});
