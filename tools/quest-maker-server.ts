// Quest maker with live saving. Serves tools/quest-maker.html and lets it read and
// write the starter quest files in data/quests/, so every edit lands in the repo.
//
//   bun tools/quest-maker-server.ts          then open http://localhost:8744
//   PORT=9000 bun tools/quest-maker-server.ts
//
// Dev-only on purpose: it listens on localhost and is not part of the Next app,
// so nothing deployed can write to disk. Plain node:http, so it needs no extra types.
import { createServer, type ServerResponse } from "node:http";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, "..", "data", "quests");
const PAGE = path.join(HERE, "quest-maker.html");
const port = Number(process.env.PORT) || 8744;

// Plain file names only (quests.json, science-b.json): no paths, no traversal.
const NAME = /^[a-z0-9][a-z0-9_-]*\.json$/i;
const fileFor = (name: string | null) => (name && NAME.test(name) ? path.join(DIR, name) : null);

function send(res: ServerResponse, status: number, body: unknown, type = "application/json") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

async function readBody(req: AsyncIterable<Buffer>) {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/" || url.pathname === "/quest-maker.html") {
      return send(res, 200, await readFile(PAGE, "utf8"), "text/html; charset=utf-8");
    }

    if (url.pathname === "/api/files" && req.method === "GET") {
      const files = (await readdir(DIR)).filter((f) => NAME.test(f)).sort();
      return send(res, 200, { dir: "data/quests", files });
    }

    if (url.pathname === "/api/quests") {
      const name = url.searchParams.get("file");
      const file = fileFor(name);
      if (!file) return send(res, 400, { error: "file must be a plain name like quests.json" });

      if (req.method === "GET") {
        let text: string;
        try {
          text = await readFile(file, "utf8");
        } catch {
          return send(res, 404, { error: `${name} doesn't exist` });
        }
        try {
          return send(res, 200, JSON.parse(text));
        } catch (err) {
          return send(res, 422, { error: `${name} isn't valid JSON: ${(err as Error).message}` });
        }
      }

      if (req.method === "PUT") {
        let quests: unknown;
        try {
          quests = JSON.parse(await readBody(req));
        } catch {
          return send(res, 400, { error: "body must be JSON" });
        }
        const ok = Array.isArray(quests) && quests.every((q) => q && typeof q === "object" && typeof q.title === "string");
        if (!ok) return send(res, 400, { error: "body must be an array of quests, each with a title" });
        // Keep the file's existing line endings (Windows checkouts use CRLF) so git sees no noise.
        const crlf = await readFile(file, "utf8").then((t) => t.includes("\r\n"), () => false);
        const text = JSON.stringify(quests, null, 2) + "\n";
        // Write to a temp file and rename, so the app never reads a half-written file.
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, crlf ? text.replace(/\n/g, "\r\n") : text);
        await rename(tmp, file);
        return send(res, 200, { ok: true, file: name, count: (quests as unknown[]).length });
      }
    }

    send(res, 404, { error: "not found" });
  } catch (err) {
    send(res, 500, { error: (err as Error).message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Quest maker: http://localhost:${port}  (saving into data/quests/)`);
});
