"use client";
import { useEffect, useState } from "react";

// Your proof photo while the AI looks at it. When you pick it, the photo
// develops out of a soft blur. While it's being checked, the photo softens
// under a slow glow made from its own colours, and a band of light sweeps down
// it again and again, so you can see it's being read. When the verdict lands,
// the glow clears and the photo comes back sharp. All CSS (the `ps-` rules in
// globals.css); never used with reduced motion.
export function PhotoScan({ src, looking }: { src: string; looking: boolean }) {
  const glow = usePhotoColours(src);
  return (
    <div className="ps-frame" data-looking={looking ? "" : undefined} style={glow}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Your proof" className="ps-photo" />
      <div aria-hidden className="ps-glow" />
      <div aria-hidden className="ps-sweep" />
    </div>
  );
}

// The photo's colour in each corner: drawn onto a 2×2 canvas, then read back.
// They become --c1 to --c4, the four corners of the glow. Falls back to the
// app's sky blues if the photo can't be read.
function usePhotoColours(src: string) {
  const [colours, setColours] = useState<Record<string, string>>({});
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 2;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 2, 2);
      const d = ctx.getImageData(0, 0, 2, 2).data;
      const out: Record<string, string> = {};
      for (let i = 0; i < 4; i++) out[`--c${i + 1}`] = `rgb(${d[i * 4]} ${d[i * 4 + 1]} ${d[i * 4 + 2]})`;
      setColours(out);
    };
    img.src = src;
  }, [src]);
  return colours;
}
