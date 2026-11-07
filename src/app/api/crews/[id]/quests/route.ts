import { body, noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { shareQuest } from "@/server/crews";

export const POST = authed<RouteContext<"/api/crews/[id]/quests">>(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const { quest_id } = await body<{ quest_id: string }>(req);
  await shareQuest(user, id, quest_id);
  return noContent();
});
