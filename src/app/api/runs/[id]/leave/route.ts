import { noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { leaveRun } from "@/server/people";

// "I need to go": ends a quest with someone new without reporting them.
export const POST = authed<RouteContext<"/api/runs/[id]/leave">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  await leaveRun(user, id);
  return noContent();
});
