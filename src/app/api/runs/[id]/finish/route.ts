import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { finishRun } from "@/server/runs";

// "Finish now" on a crew quest, once your proof is in, instead of waiting for the crew.
export const POST = authed<RouteContext<"/api/runs/[id]/finish">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await finishRun(user, id));
});
