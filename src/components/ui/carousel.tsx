"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { tick } from "@/lib/feedback";

// A swipeable row that settles on the nearest card. While it moves, cards get a
// horizontal motion blur that scales with speed; cards away from the start sit
// slightly smaller and softer; each new card that settles gives a quiet tick.
export function Carousel({ items, label, itemClassName = "w-[68%]" }: { items: { key: string; node: ReactNode }[]; label: string; itemClassName?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const blur = useRef<SVGFEGaussianBlurElement>(null);
  const id = `cb${useId().replace(/[^a-z0-9]/gi, "")}`;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastX = el.scrollLeft;
    let lastT = performance.now();
    let amount = 0;
    let frame = 0;
    let active = 0;

    const layout = () => {
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const kids = Array.from(el.children) as HTMLElement[];
      let nearest = 0;
      let best = Infinity;
      kids.forEach((k, i) => {
        const d = (k.offsetLeft - pad - el.scrollLeft) / k.offsetWidth;
        const a = Math.min(Math.abs(d), 1);
        if (Math.abs(d) < best) {
          best = Math.abs(d);
          nearest = i;
        }
        if (!reduced) {
          k.style.transform = `scale(${1 - a * 0.05})`;
          k.style.opacity = String(1 - a * 0.3);
        }
      });
      if (nearest !== active) {
        active = nearest;
        tick(0.45);
      }
    };

    const settle = () => {
      amount *= 0.82;
      if (amount < 0.05) amount = 0;
      blur.current?.setAttribute("stdDeviation", `${amount.toFixed(2)} 0`);
      if (amount > 0) frame = requestAnimationFrame(settle);
    };

    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(el.scrollLeft - lastX) / Math.max(now - lastT, 1); // px per ms
      lastX = el.scrollLeft;
      lastT = now;
      if (!reduced) {
        amount = Math.min(Math.max(amount, v * 4), 7);
        blur.current?.setAttribute("stdDeviation", `${amount.toFixed(2)} 0`);
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(settle);
      }
      layout();
    };

    layout();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items.length]);

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={id} x="-10%" y="0" width="120%" height="100%">
          <feGaussianBlur ref={blur} stdDeviation="0 0" />
        </filter>
      </svg>
      <div
        ref={track}
        role="list"
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pt-1 pb-4"
        style={{ filter: `url(#${id})` }}
      >
        {items.map((it) => (
          <div key={it.key} role="listitem" className={`shrink-0 snap-start snap-always transition-[transform,opacity] duration-150 ease-out ${itemClassName}`}>
            {it.node}
          </div>
        ))}
      </div>
    </>
  );
}
