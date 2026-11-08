"use client";
import { useEffect, useRef } from "react";
import { ImageGeneration, type ImageGenerationHandle } from "img-fx";

// Your proof photo while the AI looks at it. When you pick it, the photo
// develops out of a pixel mosaic. While Gemini is checking, it breaks back
// into cells tinted from its own colours and churns, so you can see that it's
// being read. When the verdict lands, it reassembles. (img-fx is a small WebGL
// effect; this file is only loaded on the proof screen, and never with
// reduced motion.)
export function PhotoScan({ src, looking }: { src: string; looking: boolean }) {
  const fx = useRef<ImageGenerationHandle>(null);
  const shown = useRef(false);

  // develop the photo once, as soon as the effect is ready
  useEffect(() => {
    const id = setTimeout(() => {
      fx.current?.triggerReveal({ hold: "manual" });
      shown.current = true;
    }, 60);
    return () => clearTimeout(id);
  }, [src]);

  // churn while looking, reassemble when done
  useEffect(() => {
    const h = fx.current;
    if (!h || !shown.current) return;
    if (looking) h.triggerRegenerate({ autoReveal: false, tintFromImage: true });
    else if (!h.isImageActive()) h.triggerReveal({ hold: "manual" });
  }, [looking]);

  return (
    <ImageGeneration ref={fx} preset="pixels-organic" theme="dark" images={[src]} cardBg="#0b0c0b" borderRadius={28} className="size-full">
      <div className="size-full" />
    </ImageGeneration>
  );
}
