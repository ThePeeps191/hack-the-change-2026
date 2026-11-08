"use client";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";

// The sun's path across the sky as a progress bar. It rises on the left at 0
// and sets on the right when you reach the goal, leaving a warm trail behind
// it. Everyone gets the same picture: a day outdoors, filling up.
//
// The geometry is a half circle (centre 150,132, radius 118). A point at
// progress t sits at angle pi*(1-t), so x = 150 + 118cos(a), y = 132 - 118sin(a).
//
// It's meant to look drawn by hand, not by a ruler. One SVG filter
// (feTurbulence noise feeding feDisplacementMap) roughens the trail like a
// crayon line. The sun is a small solid core whose edge breaks up into rings of
// specks, smaller and fainter the further out they are, so its light seems to
// diffuse into the sky. The rings turn slowly, in opposite directions.
const CX = 150;
const CY = 132;
const R = 118;
const PATH = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;

// Specks round the sun: ring k has more, smaller, fainter dots, nudged off an
// even spacing by a fixed pattern so they never look machine-placed.
const RINGS = [0, 1, 2, 3].map((k) => {
  const n = 9 + k * 5;
  return {
    k,
    dots: Array.from({ length: n }, (_, i) => {
      const jitter = Math.sin(i * 12.9898 + k * 78.233) * 0.5;
      const a = ((i + jitter) / n) * Math.PI * 2;
      const r = 10.5 + k * 4.6 + Math.cos(i * 4.1 + k) * 1.4;
      // Rounded so the server and the browser print the same numbers.
      const round = (v: number) => Math.round(v * 100) / 100;
      // dx, dy: the way out from the sun, for the twinkle's drift. delay: when it twinkles.
      return {
        x: round(Math.cos(a) * r), y: round(Math.sin(a) * r), s: round(Math.max(0.55, 1.9 - k * 0.42 + Math.sin(i * 2.3) * 0.25)),
        dx: round(Math.cos(a) * (1.5 + k)), dy: round(Math.sin(a) * (1.5 + k)), delay: round(((i * 7 + k * 3) % 11) * 0.23),
      };
    }),
  };
});

// Specks of light drifting along the part of the day you've had, from sunrise
// toward the sun, like warmth flowing along the path. Each speck has its own
// start, a slightly different distance from the arc and its own size, and it
// fades in and out over its trip. They're decoration and stand for nothing.
const SPECKS = [
  { phase: 0, off: -5, size: 1.6 },
  { phase: 0.17, off: 4.5, size: 1.1 },
  { phase: 0.34, off: -2, size: 1.3 },
  { phase: 0.5, off: 6, size: 0.9 },
  { phase: 0.67, off: -6.5, size: 1.2 },
  { phase: 0.84, off: 2.5, size: 1.5 },
];

function Speck({ clock, t, phase, off, size }: { clock: MotionValue<number>; t: MotionValue<number>; phase: number; off: number; size: number }) {
  const at = (c: number, v: number) => {
    const f = (c + phase) % 1;
    const a = Math.PI * (1 - f * v);
    return { f, x: CX + (R + off) * Math.cos(a), y: CY - (R + off) * Math.sin(a) };
  };
  const cx = useTransform([clock, t], ([c, v]: number[]) => at(c, v).x);
  const cy = useTransform([clock, t], ([c, v]: number[]) => at(c, v).y);
  const opacity = useTransform([clock, t], ([c, v]: number[]) => (v < 0.04 ? 0 : Math.sin(Math.PI * at(c, v).f) * 0.85));
  return <motion.circle r={size} fill="#fff3d1" style={{ cx, cy, opacity }} />;
}

const noop = () => () => {};
const yes = () => true;
const no = () => false;

export function SunArc({ progress, children, caption, className = "" }: { progress: number; children?: ReactNode; caption?: ReactNode; className?: string }) {
  const id = `sun${useId().replace(/[^a-z0-9]/gi, "")}`;
  const reduce = useReducedMotion();
  // False on the server and during hydration, true after: the moving parts
  // only appear once we know the phone's motion setting, so the first render
  // matches the server exactly.
  const mounted = useSyncExternalStore(noop, yes, no);
  const moving = mounted && !reduce;
  const t = useMotionValue(0);
  const target = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (reduce) {
      t.set(target);
      return;
    }
    const a = animate(t, target, { duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 });
    return () => a.stop();
  }, [t, target, reduce]);

  const x = useTransform(t, (v) => CX + R * Math.cos(Math.PI * (1 - v)));
  const y = useTransform(t, (v) => CY - R * Math.sin(Math.PI * (1 - v)));
  const offset = useTransform(t, (v) => 1 - v);
  const clock = useMotionValue(0);
  useEffect(() => {
    if (reduce) return;
    const a = animate(clock, [0, 1], { duration: 7, repeat: Infinity, ease: "linear" });
    return () => a.stop();
  }, [clock, reduce]);

  return (
    <div className={`mx-auto w-full max-w-[320px] ${className}`}>
      <div className="relative">
        <svg viewBox="0 0 300 140" className="block w-full overflow-visible" aria-hidden>
          <defs>
            <filter id={`${id}r`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="5" />
            </filter>
          </defs>
          {/* the horizon, a little uneven */}
          <path d={`M10 ${CY} C 80 ${CY - 1.5}, 200 ${CY + 1.5}, 290 ${CY}`} fill="none" stroke="rgb(255 255 255 / .3)" strokeWidth="1.5" strokeLinecap="round" filter={`url(#${id}r)`} />
          {/* the whole day, dotted */}
          <path d={PATH} fill="none" stroke="rgb(255 255 255 / .4)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 8" />
          {/* the part of the day you've had, in rough crayon */}
          <motion.path d={PATH} fill="none" stroke="#ffe2a6" strokeWidth="3.2" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" filter={`url(#${id}r)`} style={{ strokeDashoffset: offset }} />
          {moving && SPECKS.map((p, i) => <Speck key={i} clock={clock} t={t} {...p} />)}
          {/* the sun: a solid core, a pale flat ring, then specks diffusing outward */}
          <motion.g style={{ x, y }}>
            <circle r="13" fill="#ffe3a3" opacity={0.28} />
            {RINGS.map(({ k, dots }) => (
              <motion.g
                key={k}
                animate={moving ? { rotate: k % 2 ? -360 : 360 } : undefined}
                transition={{ duration: 16 + k * 7, repeat: Infinity, ease: "linear" }}
              >
                {dots.map((d, i) => (
                  <circle
                    key={i}
                    cx={d.x}
                    cy={d.y}
                    r={d.s}
                    fill={k < 2 ? "#ffe2a0" : "#fff1d0"}
                    opacity={[0.95, 0.73, 0.51, 0.29][k]}
                    className={moving ? "sun-speck" : undefined}
                    style={moving ? { ["--dx" as string]: `${d.dx}px`, ["--dy" as string]: `${d.dy}px`, animationDelay: `${d.delay}s` } : undefined}
                  />
                ))}
              </motion.g>
            ))}
            <circle r="7.5" fill="#ffd27a" />
            <circle r="4" cx="-1" cy="-1" fill="#fff5da" />
          </motion.g>
        </svg>
        {children && <div className="absolute inset-x-0 bottom-[11%] flex flex-col items-center">{children}</div>}
      </div>
      {caption && <div className="mt-1.5 text-center">{caption}</div>}
    </div>
  );
}
