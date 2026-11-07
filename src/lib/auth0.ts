import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Created on first use, so mock mode never needs the AUTH0_* variables. No
// "server-only" here because src/proxy.ts imports this too.
let client: Auth0Client | null = null;

export function auth0() {
  client ??= new Auth0Client({ signInReturnToPath: "/" });
  return client;
}
