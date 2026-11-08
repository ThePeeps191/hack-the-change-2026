import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { User } from "./contracts";
import { auth0 } from "./auth0";
import { AUTH_MODE, DEMO_MODE } from "./env";
import { findOrCreateUser } from "@/server/users";

export const DEMO_COOKIE = "amble_demo";

// Returns the signed-in user, or null.
// - AUTH_MODE=mock: you're Sam, or whoever the x-amble-user header names, so two
//   tabs can be two people (see src/lib/api.ts). No login, no Auth0.
// - AUTH_MODE=live: the Auth0 session, or a signed demo cookie when DEMO_MODE is
//   on, so judges without a student email can get in.
export async function currentUser(): Promise<User | null> {
  if (AUTH_MODE === "mock") {
    const raw = (await headers()).get("x-amble-user") ?? "sam";
    const slug = raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24) || "sam";
    return findOrCreateUser({
      sub: `mock|${slug}`,
      name: slug[0].toUpperCase() + slug.slice(1),
      verified: true,
      ageConfirmed: true,
    });
  }

  if (DEMO_MODE) {
    const demo = readDemoCookie((await cookies()).get(DEMO_COOKIE)?.value);
    if (demo) return findOrCreateUser({ sub: `demo|${demo.id}`, name: demo.name, verified: true, ageConfirmed: true });
  }

  const session = await auth0().getSession();
  if (!session) return null;
  const { sub, name, nickname, picture, email, email_verified } = session.user;
  return findOrCreateUser({
    sub,
    name: firstName(name ?? nickname ?? "friend"),
    avatar: picture ?? null,
    verified: email_verified === true && isAllowedEmail(email),
  });
}

// Only a first name is ever shown, and only after both people accept.
function firstName(name: string) {
  return name.split(/[\s@]/)[0].slice(0, 40) || "friend";
}

// ALLOWED_EMAIL_DOMAINS=ucalgary.ca limits meeting strangers to those domains.
// Leave it empty to accept any verified email.
function isAllowedEmail(email: string | undefined) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return true;
  const domain = email?.split("@")[1]?.toLowerCase() ?? "";
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function sign(payload: string) {
  return createHmac("sha256", process.env.AUTH0_SECRET || "amble-demo").update(payload).digest("base64url");
}

export function makeDemoCookie(name: string) {
  const payload = Buffer.from(JSON.stringify({ id: crypto.randomUUID(), name })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// "Try the demo" guests (and local mock users when DEMO_MODE is on) get the
// demo-only extras, like "Count it anyway". Real accounts never do.
export async function isDemoGuest() {
  if (!DEMO_MODE) return false;
  if (AUTH_MODE === "mock") return true;
  return readDemoCookie((await cookies()).get(DEMO_COOKIE)?.value) !== null;
}

export const demoSubFrom = (cookie: string) => `demo|${readDemoCookie(cookie)!.id}`;

function readDemoCookie(value: string | undefined): { id: string; name: string } | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}
