import { body, ok } from "@/lib/http";
import { authed, publicOrigin } from "@/lib/route";
import { createInvite } from "@/server/matching";

export const POST = authed(async (user, req) => {
  const { quest_id } = await body<{ quest_id?: string }>(req);
  return ok(await createInvite(user, publicOrigin(req), quest_id));
});
