// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { currentUser } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import type { User } from "@/lib/contracts";

export async function GET() {
  const user = await currentUser();
  return user ? ok(user) : fail("not signed in", 401);
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return fail("not signed in", 401);
  const patch = await body<User>(req);
  return ok({ ...user, display_name: patch.display_name ?? user.display_name });
}
