import { cookies } from "next/headers";
import { DEMO_COOKIE, demoSubFrom, makeDemoCookie } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/env";
import { body, fail, noContent } from "@/lib/http";
import { safe } from "@/lib/route";
import { joinDemoCrew } from "@/server/crews";
import { findOrCreateUser } from "@/server/users";

// DEMO_MODE only: a way in for judges without a student email.
export const POST = safe(async (req) => {
  if (!DEMO_MODE) return fail("not found", 404);
  const { name } = await body<{ name: string }>(req);
  const clean = name?.trim().slice(0, 40) || "Guest";
  const value = makeDemoCookie(clean);
  (await cookies()).set(DEMO_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: req.url.startsWith("https"), maxAge: 86_400, path: "/" });
  const user = await findOrCreateUser({ sub: demoSubFrom(value), name: clean, verified: true, ageConfirmed: true });
  await joinDemoCrew(user.id);
  return noContent();
});
