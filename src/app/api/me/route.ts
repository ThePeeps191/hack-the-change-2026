import type { User } from "@/lib/contracts";
import { body, noContent, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { deleteMyData, updateProfile } from "@/server/users";

export const GET = authed(async (user) => ok(user));

export const PATCH = authed(async (user, req) => ok(await updateProfile(user, await body<User>(req))));

// Removes what's personal. See src/server/users.ts.
export const DELETE = authed(async (user) => {
  await deleteMyData(user);
  return noContent();
});
