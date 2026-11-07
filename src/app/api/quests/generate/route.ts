import { body, fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { questsNear, tagsFor } from "@/server/quests";

export const POST = authed(async (user, req) => {
  const { lat, lng, count } = await body<{ lat: number; lng: number; count: number }>(req);
  if (typeof lat !== "number" || typeof lng !== "number") return fail("lat and lng are required");
  const size = Math.min(Math.max(count ?? 3, 1), 10);
  return ok(await questsNear(lat, lng, size, { prefs: user.prefs, prefer_tags: tagsFor([user.prefs]) }));
});
