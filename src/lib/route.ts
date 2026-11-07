import "server-only";
import { currentUser } from "./auth";
import type { User } from "./contracts";
import { fail } from "./http";

// Throw this from anywhere in src/server/ to send { error } with a status.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found`);

// Wraps a route handler: signs the user in, and turns thrown errors into the
// { error } shape from docs/CONTRACTS.md.
export function authed<C = unknown>(handler: (user: User, req: Request, ctx: C) => Promise<Response>) {
  return safe<C>(async (req, ctx) => {
    const user = await currentUser();
    if (!user) return fail("not signed in", 401);
    return handler(user, req, ctx);
  });
}

// The same error handling, for the few routes that work signed out.
export function safe<C = unknown>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status);
      // A malformed id in the URL is just something that doesn't exist.
      if ((e as { code?: string }).code === "22P02") return fail("not found", 404);
      // Only the message: never log location, media or request bodies.
      console.error(`${req.method} ${new URL(req.url).pathname} failed:`, (e as Error).message);
      return fail("something went wrong", 500);
    }
  };
}

// The site's public address, for links people share.
export function publicOrigin(req: Request) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host");
  if (host) return `${req.headers.get("x-forwarded-proto") ?? "https"}://${host}`;
  return new URL(req.url).origin;
}
