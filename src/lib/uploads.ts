import "server-only";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { one, query } from "@/lib/db";

// Proof photos and videos are stored in the database (the uploads table), so
// any server can serve them, including short-lived Vercel functions. They're
// personal data: they're only ever served through /api/media/:id, which checks
// you were on that quest. The AI reads them from a temp file, made on demand.
const dir = () => process.env.UPLOADS_DIR || path.join(os.tmpdir(), "amble-uploads");

// Vercel refuses request bodies over 4.5 MB, so the phone shrinks photos first
// and videos have to be short.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

export const isAllowedMedia = (type: string) => Object.hasOwn(EXTENSIONS, type);

const tempPath = (name: string) => path.join(dir(), path.basename(name));

// Returns the upload's name, which is what submissions.media_path stores.
export async function saveUpload(id: string, file: File) {
  const name = `${id}${EXTENSIONS[file.type]}`;
  const data = Buffer.from(await file.arrayBuffer());
  await query("insert into uploads (name, data) values ($1, $2) on conflict (name) do update set data = excluded.data", [name, data]);
  await mkdir(dir(), { recursive: true });
  await writeFile(tempPath(name), data);
  return name;
}

export async function readUpload(name: string) {
  const row = await one<{ data: Uint8Array }>("select data from uploads where name = $1", [path.basename(name)]);
  if (!row) throw new Error("upload not found");
  return Buffer.from(row.data);
}

// A file path the AI can read. Copies the upload out of the database if this
// server doesn't have it yet.
export async function uploadPath(name: string) {
  const file = tempPath(name);
  const exists = await stat(file).then(() => true, () => false);
  if (!exists) {
    await mkdir(dir(), { recursive: true });
    await writeFile(file, await readUpload(name));
  }
  return file;
}

export async function deleteUpload(name: string) {
  await query("delete from uploads where name = $1", [path.basename(name)]);
  await rm(tempPath(name), { force: true });
}
