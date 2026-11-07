import { body, noContent } from "@/lib/http";
import type { Checkin } from "@/lib/contracts";
import { authed } from "@/lib/route";
import { saveCheckin } from "@/server/runs";

// One-tap mood before or after a quest.
export const POST = authed<RouteContext<"/api/runs/[id]/checkins">>(async (user, req, ctx) => {
  const { id } = await ctx.params;
  await saveCheckin(user, id, await body<Checkin>(req));
  return noContent();
});
