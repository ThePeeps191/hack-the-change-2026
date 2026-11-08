import { body, noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { setHint } from "@/server/runs";

// "How to spot me" on a quest with someone new. Body: { hint }. Empty clears it.
export const POST = authed<RouteContext<"/api/runs/[id]/hint">>(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const { hint } = await body<{ hint?: string }>(req);
  await setHint(user, id, typeof hint === "string" ? hint : "");
  return noContent();
});
