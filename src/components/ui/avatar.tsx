"use client";
// A person or crew as a little animated blob character that blinks and looks
// around. The drawing and animation come from src/lib/bots/grokbot.js; this
// file picks which character a person gets (the one they chose on the You page,
// or else one from their name) and dresses it in Amble's style
// (our colours, soft shapes only, an ink outline, slower glances). We hash the name (FNV-1a) and
// use the number to pick a shape and a colour, so the same name always gets
// the same character. The bot is made in the browser after the page loads,
// and holds still for people who turn motion off.
import { useEffect, useRef } from "react";
import GrokBot from "@/lib/bots/grokbot";

// Amble's own colours instead of the library's neon ones: the sky blues, the
// sun, the park green, the Claim orange and a few softer outdoor tones. Each
// has the eye colour that reads best on it (ink on the light ones).
export const avatarColors = [
  { fill: "#2f66f5", eye: "#ffffff", name: "blue" },
  { fill: "#7aa2e0", eye: "#121412", name: "sky" },
  { fill: "#2c5cb0", eye: "#ffffff", name: "deep sky" },
  { fill: "#f4b63f", eye: "#121412", name: "sun" },
  { fill: "#1f9a59", eye: "#ffffff", name: "park green" },
  { fill: "#8fcfa6", eye: "#121412", name: "meadow" },
  { fill: "#ee6a2c", eye: "#ffffff", name: "orange" },
  { fill: "#f29a7b", eye: "#121412", name: "sunset coral" },
  { fill: "#9b87e8", eye: "#ffffff", name: "dusk lavender" },
  { fill: "#5fb8c9", eye: "#121412", name: "glacier teal" },
];
// Only the soft, outdoorsy shapes (cloud, pebble, leaf, drop, flower...), not
// the hard-edged ones like gears, shields and hexagons.
export const avatarShapes: string[] = ["circle", "cloud", "clover", "pebble", "flower", "drop", "pill", "egg", "blob", "leaf", "heart"].filter((s) =>
  (GrokBot.SHAPE_NAMES as string[]).includes(s),
);

// FNV-1a, which spreads short names across the palette better than a plain sum.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// The character someone picked on the You page ("cloud:3": a shape and a colour
// number), or null to use the one their name gives them.
export function characterFor(name: string, avatar?: string | null) {
  const [shape, colour] = (avatar ?? "").split(":");
  if (avatarShapes.includes(shape) && avatarColors[Number(colour)]) return { shape, color: avatarColors[Number(colour)] };
  const n = hash(name);
  return { shape: avatarShapes[n % avatarShapes.length], color: avatarColors[(n >>> 8) % avatarColors.length] };
}

export function Avatar({ name, avatar, size = 40, ring = false }: { name: string; avatar?: string | null; size?: number; ring?: boolean }) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A mouse: the eyes follow it. A phone has no mouse, so the eyes look
    // somewhere random every few seconds instead.
    const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
    // mischief off: no spitting or winking, just blinks and glances.
    const { shape, color } = characterFor(name, avatar);
    const bot = new GrokBot(host.current!, {
      size,
      shape,
      color: color.fill,
      eyeColor: color.eye,
      mischief: false,
      followPointer: mouse && !still,
      still,
    });
    bot.svg.removeAttribute("role");
    bot.svg.setAttribute("aria-hidden", "true");
    // A thin ink outline, like the rest of Amble's hand-drawn icons. It follows
    // the theme's ink colour, so it flips with dark mode.
    bot.body.style.stroke = "var(--color-ink)";
    bot.body.style.strokeWidth = String(Math.max(0.05, 2.2 / size));
    bot.body.style.strokeLinejoin = "round";

    let timer = 0;
    const glance = () => {
      bot.look(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
      timer = window.setTimeout(glance, 2500 + Math.random() * 3000); // unhurried, like the rest of the app
    };
    if (!mouse && !still) timer = window.setTimeout(glance, Math.random() * 2000);

    return () => {
      clearTimeout(timer);
      bot.destroy();
    };
  }, [name, avatar, size]);

  return (
    <span
      ref={host}
      className={`inline-block shrink-0 rounded-full ${ring ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

// A little crown for whoever is on top this week.
export function Crown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M3.5 8.5l4.2 3.6L12 5l4.3 7.1 4.2-3.6-1.7 9.5H5.2z" fill="#f4c34f" stroke="#c9922a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.4 19.6h13.2" stroke="#c9922a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.3" fill="#fff3c8" />
    </svg>
  );
}
