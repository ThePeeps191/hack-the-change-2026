import { body, fail, noContent, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { clearFree, myAvailability, setFree } from "@/server/matching";

// Whether you're still looking, so the match screen doesn't search forever
// after your 20 minutes are up or when you open it without tapping "I'm free".
export const GET = authed(async (user) => ok({ free: (await myAvailability(user.id)) != null }));

export const POST = authed(async (user, req) => {
  const { lat, lng, quest_id } = await body<{ lat: number; lng: number; quest_id?: string }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  return ok(await setFree(user, lat, lng, typeof quest_id === "string" ? quest_id : null));
});

export const DELETE = authed(async (user) => {
  await clearFree(user);
  return noContent();
});
