import { body, fail, noContent, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { clearFree, setFree } from "@/server/matching";

export const POST = authed(async (user, req) => {
  const { lat, lng } = await body<{ lat: number; lng: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  return ok(await setFree(user, lat, lng));
});

export const DELETE = authed(async (user) => {
  await clearFree(user);
  return noContent();
});
