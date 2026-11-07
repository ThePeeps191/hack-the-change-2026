import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getQuest } from "@/server/quests";

export const GET = authed<RouteContext<"/api/quests/[id]">>(async (_user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getQuest(id));
});
