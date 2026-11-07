import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Proof photos and videos live on disk, outside the app folder on the server so
// deploys don't touch them. They're personal data: they're only ever served
// through /api/media/:id, which checks you were on that quest.
const dir = () => process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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

// Returns the file's name inside the uploads folder.
export async function saveUpload(id: string, file: File) {
  await mkdir(dir(), { recursive: true });
  const name = `${id}${EXTENSIONS[file.type]}`;
  await writeFile(path.join(dir(), name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export const uploadPath = (name: string) => path.join(dir(), path.basename(name));

export const readUpload = (name: string) => readFile(uploadPath(name));

export const deleteUpload = (name: string) => rm(uploadPath(name), { force: true });
