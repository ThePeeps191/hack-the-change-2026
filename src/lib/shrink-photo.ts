// Phones take 3 to 12 MB photos, but Vercel refuses uploads over 4.5 MB and the
// AI only looks at about 1600 px anyway. So photos are resized to a JPEG on the
// phone before sending. Anything the browser can't decode is sent as it is.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 1600;

export async function shrinkPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "proof.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
