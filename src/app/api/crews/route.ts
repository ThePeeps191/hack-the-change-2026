import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { createCrew, myCrews } from "@/server/crews";

// Crews I'm in.
export const GET = authed(async (user) => ok(await myCrews(user)));

export const POST = authed(async (user, req) => {
  const { name } = await body<{ name: string }>(req);
  return ok(await createCrew(user, name));
});
