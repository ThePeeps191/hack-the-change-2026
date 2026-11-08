"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CAMPUS_CENTER } from "@/lib/config";

// Small things that keep the match screen alive while you wait.

// A few stars round the stage, twinkling in place while you wait. They're
// decoration only and never stand for people.
const specks = [
  { x: -150, y: -70, s: 7, d: 0 },
  { x: 140, y: -86, s: 5, d: 1.2 },
  { x: -118, y: 78, s: 6, d: 2.1 },
  { x: 160, y: 60, s: 8, d: 0.6 },
  { x: -40, y: -100, s: 4, d: 1.7 },
  { x: 60, y: 104, s: 5, d: 2.8 },
  { x: -176, y: 10, s: 4, d: 3.3 },
  { x: 186, y: -10, s: 5, d: 0.9 },
];

export function Specks({ gather }: { gather: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {specks.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: p.s * 0.6, height: p.s * 0.6, boxShadow: "0 0 8px rgb(255 255 255 / .7)" }}
          initial={{ x: p.x, y: p.y, opacity: 0 }}
          animate={
            gather
              ? { x: p.x * 0.15, y: p.y * 0.15, opacity: 0, scale: 0.4 }
              : reduce
                ? { x: p.x, y: p.y, opacity: 0.6 }
                : { x: p.x, y: p.y, opacity: [0.2, 0.85, 0.2], scale: [0.7, 1, 0.7] }
          }
          transition={reduce ? { duration: 0 } : gather ? { duration: 0.7, ease: [0.5, 0, 0.75, 0] } : { duration: 2.8 + (i % 3) * 0.9, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// Real quest spots nearby, one at a time, so the wait has something true to
// read. With none to show, it falls back to a plain line.
export function PlaceTicker() {
  const [places, setPlaces] = useState<string[]>([]);
  const [i, setI] = useState(0);
  useEffect(() => {
    api
      .quests()
      .then((qs) => {
        const near = qs.filter((q) => q.lat != null && q.lng != null && Math.abs(q.lat - CAMPUS_CENTER.lat) < 0.0135 && Math.abs(q.lng - CAMPUS_CENTER.lng) < 0.021);
        setPlaces([...new Set(near.map((q) => q.place_name).filter((n): n is string => !!n))]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (places.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % places.length), 2400);
    return () => clearInterval(t);
  }, [places.length]);
  if (places.length === 0) return <>Anyone free within a short walk.</>;
  const name = places[i % places.length];
  return (
    <>
      Quests waiting at{" "}
      <span className="relative inline-grid h-[1.3em] overflow-hidden align-bottom">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={name}
            className="col-start-1 row-start-1 whitespace-nowrap font-semibold text-on-sky"
            initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {name}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}

// A quiet stopwatch, so a minute of waiting feels like a minute.
export function Elapsed() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

// A small burst when you're matched: a ring of sparks flying outward.
export function Burst() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 110 + (i % 3) * 16;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: i % 2 ? 5 : 7, height: i % 2 ? 5 : 7 }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}
