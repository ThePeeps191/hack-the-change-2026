import { body, fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getCrew, setCrewAvatar } from "@/server/crews";

export const GET = authed<RouteContext<"/api/crews/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  return ok(await getCrew(user, id));
});

// Change the crew's character: { avatar: "cloud:3" }, or null for the original.
export const PATCH = authed<RouteContext<"/api/crews/[id]">>(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const { avatar } = await body<{ avatar?: string | null }>(req);
  if (avatar !== null && typeof avatar !== "string") return fail("avatar is required");
  return ok(await setCrewAvatar(user, id, avatar));
});
