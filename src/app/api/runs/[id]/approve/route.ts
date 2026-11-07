import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { approveByHand } from "@/server/proof";

// DEMO_MODE only: approve pending proof by hand if the AI misbehaves on stage.
export const POST = authed<RouteContext<"/api/runs/[id]/approve">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok({ approved: await approveByHand(user, id) });
});
