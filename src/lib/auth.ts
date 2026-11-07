import "server-only";
import type { User } from "./contracts";
import { AUTH_MODE } from "./env";
import { mockUser } from "@/mocks/user";

// Returns the signed-in user, or null. With AUTH_MODE=mock everyone is the
// same made-up user, so sessions on random ports never need Auth0.
// Backend area: replace the live branch with the Auth0 session lookup.
export async function currentUser(): Promise<User | null> {
  if (AUTH_MODE === "mock") return mockUser;
  return null;
}
