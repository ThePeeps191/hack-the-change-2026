import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/auth";
import { AUTH_MODE } from "@/lib/env";
import { publicOrigin, safe } from "@/lib/route";

// Signs you out. A demo visitor's cookie is dropped and they go back to the
// login page. An Auth0 session ends through Auth0's own /auth/logout, which
// comes back to the app, and proxy.ts then shows the login page.
// Linked with a plain <a>, never next/link, so a prefetch can't sign anyone out.
export const GET = safe(async (req) => {
  const demo = req.headers.get("cookie")?.includes(`${DEMO_COOKIE}=`) ?? false;
  const to = AUTH_MODE === "live" && !demo ? "/auth/logout" : "/login";
  const res = NextResponse.redirect(new URL(to, publicOrigin(req)));
  res.cookies.delete(DEMO_COOKIE);
  return res;
});
