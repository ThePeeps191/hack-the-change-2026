// Claude reads images, not video. So for video proof the phone also sends one
// small JPEG: three still frames from the start, middle and end, side by side,
// and the AI judges that. Returns null if this browser can't decode the video
// in a few seconds; the video then counts without the AI looking at it.

const HEIGHT = 480;
const GIVE_UP_MS = 6000;

function once(video: HTMLVideoElement, event: string) {
  return new Promise<void>((resolve, reject) => {
    video.addEventListener(event, () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("can't decode")), { once: true });
  });
}

// iPhone Safari can draw a black frame from a video that hasn't played. A frame
// that's nearly one flat colour would get a real attempt rejected, so we send
// no frames at all instead, and the video counts unchecked.
function looksBlank(ctx: CanvasRenderingContext2D, x: number, width: number) {
  const { data } = ctx.getImageData(x, 0, width, HEIGHT);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4 * 37) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += y;
    sumSq += y * y;
    n++;
  }
  const mean = sum / n;
  return Math.sqrt(sumSq / n - mean * mean) < 6;
}

async function grab(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await once(video, "loadeddata");
    // A moment of muted play makes iPhone Safari decode real frames to draw.
    await video.play().catch(() => {});
    video.pause();
    if (!video.videoWidth || !video.videoHeight) return null;
    const width = Math.round((HEIGHT * video.videoWidth) / video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width * 3;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const length = Number.isFinite(video.duration) ? video.duration : 0;
    if (length < 0.5) return null; // nothing to seek through
    for (const [i, at] of [0.1, 0.5, 0.9].entries()) {
      video.currentTime = length * at;
      await once(video, "seeked");
      ctx.drawImage(video, i * width, 0, width, HEIGHT);
      if (looksBlank(ctx, i * width, width)) return null;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ? new File([blob], "frames.jpg", { type: "image/jpeg" }) : null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function videoFrames(file: File): Promise<File | null> {
  if (!file.type.startsWith("video/")) return null;
  const giveUp = new Promise<null>((resolve) => setTimeout(() => resolve(null), GIVE_UP_MS));
  return Promise.race([grab(file).catch(() => null), giveUp]);
}
