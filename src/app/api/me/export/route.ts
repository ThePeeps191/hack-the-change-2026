import { authed } from "@/lib/route";
import { exportMyData } from "@/server/users";

// Everything we hold about you, as a file.
export const GET = authed(async (user) =>
  Response.json(await exportMyData(user), {
    headers: { "content-disposition": 'attachment; filename="amble-my-data.json"' },
  }),
);
