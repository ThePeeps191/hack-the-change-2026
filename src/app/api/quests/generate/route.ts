import { body, fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { questsNear, tagsFor } from "@/server/quests";

// The AI can take up to 30 s, sometimes after the response (after()). Vercel's
// default limit on some plans is 10 s, which would cut it off.
export const maxDuration = 60;

export const POST = authed(async (user, req) => {
  const { lat, lng, count } = await body<{ lat: number; lng: number; count: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  const size = Math.min(Math.max(count ?? 3, 1), 10);
  return ok(await questsNear(lat, lng, size, { prefs: user.prefs, prefer_tags: tagsFor([user.prefs]) }));
});
