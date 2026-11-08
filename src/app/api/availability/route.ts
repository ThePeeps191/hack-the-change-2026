import { after } from "next/server";
import { body, fail, noContent, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { clearFree, setFree } from "@/server/matching";
import { warmQuests } from "@/server/quests";

// The AI can take up to 30 s, sometimes after the response (after()). Vercel's
// default limit on some plans is 10 s, which would cut it off.
export const maxDuration = 60;

export const POST = authed(async (user, req) => {
  const { lat, lng } = await body<{ lat: number; lng: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  const result = await setFree(user, lat, lng);
  after(() => warmQuests(lat, lng, user.prefs));
  return ok(result);
});

export const DELETE = authed(async (user) => {
  await clearFree(user);
  return noContent();
});
