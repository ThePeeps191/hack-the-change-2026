import "server-only";
import type { User } from "@/lib/contracts";
import { AUTH_MODE, DEMO_MODE } from "@/lib/env";
import { HttpError } from "@/lib/route";

// Meeting a stranger needs a verified account, 18+, and daylight. Crews and
// friends aren't affected. Mock login and DEMO_MODE skip the rules, because it's
// dark by 17:00 in Calgary right now and judges won't have a student email.
const DAYLIGHT_START_HOUR = 8;
const DAYLIGHT_END_HOUR = 17;

export const safetyRulesOn = () => AUTH_MODE === "live" && !DEMO_MODE;

export function assertCanMeet(user: User) {
  if (!safetyRulesOn()) return;
  if (!user.age_confirmed_at) throw new HttpError(403, "confirm you're 18 or older before meeting someone new.");
  if (!user.email_verified) throw new HttpError(403, "meeting someone new needs a verified student email for now. crews still work.");
  if (!isDaylight(new Date())) throw new HttpError(403, "new-people quests run in daylight, 8am to 5pm. your crew's still around.");
}

export function isDaylight(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= DAYLIGHT_START_HOUR && hour < DAYLIGHT_END_HOUR;
}

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
