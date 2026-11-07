import { fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { isQuestType, listQuests } from "@/server/quests";

// ?type=anywhere for quests that work in any city.
export const GET = authed(async (_user, req) => {
  const type = new URL(req.url).searchParams.get("type");
  if (type && !isQuestType(type)) return fail("unknown quest type");
  return ok(await listQuests(type));
});
