"use client";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { VoiceBeam } from "voice-glow";

type Phase = "searching" | "found" | "waiting" | "matched" | "ended";

// How high the sun is for each step of finding someone: a low glow while we
// look, brighter once someone's nearby, and a full sunrise when you're matched.
const HEIGHT: Record<Phase, number> = { searching: 0.6, found: 0.75, waiting: 0.65, matched: 0.8, ended: 0 };

// A sunrise along the bottom of the finding-someone screen. The glow is the
// `voice-glow` library's VoiceBeam, which normally follows a microphone; here
// we drive its level by hand instead (0 to 1, read every frame), so the light
// rises as the match gets closer. While searching it breathes slowly, and the
// moment you're matched it flares to full and settles. It sits behind the
// screen's content (the sky needs `isolate` so -z-10 stays inside it).
export function SunriseGlow({ phase }: { phase: Phase }) {
  const reduce = useReducedMotion();
  const since = useRef(0);
  useEffect(() => {
    since.current = performance.now();
  }, [phase]);

  const level = () => {
    const base = HEIGHT[phase];
    if (reduce) return base;
    const t = performance.now() - since.current;
    if (phase === "matched") return base + 0.25 * Math.max(0, 1 - t / 1400); // the flare
    if (phase === "searching" || phase === "waiting") return base + 0.15 * Math.sin(t / 700); // breathing
    return base;
  };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
    <VoiceBeam
      type="mobile"
      level={level}
      idle={0.3}
      colorVariant="sunset"
      colors={["#ffe6c7", "#ffb48f", "#ff9eb5", "#ffc3a0", "#f59ac0", "#ffd6b0", "#ffa9a0"]}
      staticColors
      bands={false}
      theme="dark"
      borderRadius={0}
      scale={1.8}
      reach={2.4}
      glowSize={1.5}
      paused={!!reduce}
      className="size-full"
    >
      <div className="size-full" />
    </VoiceBeam>
    </div>
  );
}
