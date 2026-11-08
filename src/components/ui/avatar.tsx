"use client";
// A person or crew as a little animated blob character that blinks and looks
// around. The drawing and animation come from src/lib/bots/grokbot.js; this
// file only picks which character a name gets. We hash the name (FNV-1a) and
// use the number to pick a shape and a colour, so the same name always gets
// the same character. The bot is made in the browser after the page loads,
// and holds still for people who turn motion off.
import { useEffect, useRef } from "react";
import GrokBot from "@/lib/bots/grokbot";

// Bright colours only: black, gray and navy disappear in dark mode, and white in light.
const colors = ["red", "tangerine", "orange", "green", "teal", "blue", "purple", "pink", "yellow", "lime", "sky", "indigo", "coral", "mint", "lavender", "brown"];
const shapes: string[] = GrokBot.SHAPE_NAMES;

// FNV-1a, which spreads short names across the palette better than a plain sum.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Avatar({ name, size = 40, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const n = hash(name);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A mouse: the eyes follow it. A phone has no mouse, so the eyes look
    // somewhere random every 1 to 3 seconds instead.
    const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
    // mischief off: no spitting or winking, just blinks and glances.
    const bot = new GrokBot(host.current!, {
      size,
      shape: shapes[n % shapes.length],
      color: colors[(n >>> 8) % colors.length],
      mischief: false,
      followPointer: mouse && !still,
      still,
    });
    bot.svg.removeAttribute("role");
    bot.svg.setAttribute("aria-hidden", "true");

    let timer = 0;
    const glance = () => {
      bot.look(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
      timer = window.setTimeout(glance, 1000 + Math.random() * 2000);
    };
    if (!mouse && !still) timer = window.setTimeout(glance, Math.random() * 2000);

    return () => {
      clearTimeout(timer);
      bot.destroy();
    };
  }, [name, size]);

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
