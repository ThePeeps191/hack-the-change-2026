import { body, ok } from "@/lib/http";
import { authed, publicOrigin } from "@/lib/route";
import { createInvite } from "@/server/matching";

export const POST = authed(async (user, req) => {
  const { quest_id, lat, lng } = await body<{ quest_id?: string; lat?: number; lng?: number }>(req);
  const near = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : undefined;
  return ok(await createInvite(user, publicOrigin(req), quest_id, near));
});
