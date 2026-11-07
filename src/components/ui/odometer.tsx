"use client";
import { useEffect, useRef, useState } from "react";

// Rolling digits with vertical motion blur while they move (the #vblur SVG
// filter lives in the root layout). Tabular, so widths never jump.
export function Odometer({ value, className = "", delay = 0 }: { value: number | string; className?: string; delay?: number }) {
  const text = String(value);
  const [shown, setShown] = useState(() => text.replace(/\d/g, "0"));
  const [moving, setMoving] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setMoving(true);
      setShown(text);
    }, first.current ? delay + 60 : 0);
    const t2 = setTimeout(() => setMoving(false), (first.current ? delay + 60 : 0) + 700);
    first.current = false;
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [text, delay]);

  return (
    <span className={`odo inline-flex tabular-nums ${className}`}>
      <span className="sr-only">{text}</span>
      {shown.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ width: "0.62em" }}>
            <span
              className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[700ms] ease-[var(--ease-out-soft)]"
              style={{ transform: `translateY(-${Number(ch)}em)`, transitionDelay: `${i * 40}ms`, filter: moving ? "url(#vblur)" : "none" }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d} className="block h-[1em] text-center leading-none">{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden className="leading-none">{ch}</span>
        ),
      )}
    </span>
  );
}
