import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// With AUTH_MODE=live this mounts Auth0's /auth/* routes and sends signed-out
// visitors to /login. With mock login it does nothing.
//
// /api is excluded on purpose: routes check the session themselves, and running
// proxy on them would buffer uploads and cap them at 10 MB.
const PUBLIC_PAGES = ["/login", "/privacy", "/impact"];

export async function proxy(req: NextRequest) {
  if (process.env.AUTH_MODE !== "live") return NextResponse.next();

  const res = await auth0().middleware(req);
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/auth/") || PUBLIC_PAGES.includes(pathname)) return res;

  const demo = process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
  if (demo && req.cookies.has("amble_demo")) return res;
  if (await auth0().getSession(req)) return res;

  const login = new URL("/login", req.url);
  login.searchParams.set("returnTo", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
