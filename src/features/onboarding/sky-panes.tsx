"use client";
import { useEffect, useRef, useState } from "react";
import { CompassInk, Ink, PinInk, SunInk } from "@/components/ui/ink";

// The first screen's picture: three glass panes standing side by side, with
// one sunrise over campus running across all three, seen through fluted glass.
//
// How it moves: the finger (or cursor) position is written to two CSS
// variables, --px and --py (0 to 1), on the stage. The CSS does the rest:
// each pane tilts toward the finger, the light slides along the flutes and the
// clouds drift a little more than the skyline (parallax). React only re-renders
// when the pane under the finger changes, to show that step's sentence.
//
// Phones have no hover, so on arrival the light sweeps once from the first
// pane to the last, stepping through the three sentences, then settles. It
// stops the moment you touch it, and never runs with reduced motion.

const STEPS = [
  { icon: CompassInk, title: "tap I'm free", detail: "When you've got 20 minutes, tap I'm free." },
  { icon: PinInk, title: "meet nearby", detail: "Someone nearby gets the same quest. You meet at a public spot." },
  { icon: SunInk, title: "do a quest", detail: "Do one small thing together, then go on with your day." },
];

export function SkyPanes() {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const touched = useRef(false);

  // Point the panes at (px, py), both 0 to 1 across the stage.
  function point(px: number, py: number) {
    stage.current?.style.setProperty("--px", px.toFixed(3));
    stage.current?.style.setProperty("--py", py.toFixed(3));
    setActive(Math.min(2, Math.floor(px * 3)));
  }

  function follow(e: React.PointerEvent) {
    touched.current = true;
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    point(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  }

  function rest() {
    stage.current?.style.setProperty("--px", "0.5");
    stage.current?.style.setProperty("--py", "0.5");
  }

  // The one-time sweep: left to right over 2.6 s, then back to rest.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let start = 0;
    const tick = (t: number) => {
      if (touched.current) return;
      start ||= t;
      const k = Math.min(1, (t - start) / 2600);
      const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      if (k < 1) {
        point(0.08 + eased * 0.84, 0.45);
        frame = requestAnimationFrame(tick);
      } else {
        rest();
        setActive(0);
      }
    };
    const wait = setTimeout(() => (frame = requestAnimationFrame(tick)), 1100);
    return () => {
      clearTimeout(wait);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="sp-wrap">
      <div ref={stage} className="sp-stage" onPointerMove={follow} onPointerDown={follow} onPointerLeave={rest} onPointerUp={(e) => e.pointerType === "touch" && rest()}>
        <ol className="sp-panes">
          {STEPS.map((step, i) => (
            <li key={step.title} className="sp-pane" style={{ ["--i" as string]: i }} data-active={i === active ? "" : undefined}>
              {/* The same scene in every pane, shifted so the three slices line up into one picture. */}
              <div className="sp-scene" aria-hidden>
                <div className="sp-sun" />
                <div className="sp-clouds">
                  <span style={{ left: "8%", top: "16%", width: 120 }} />
                  <span style={{ left: "52%", top: "9%", width: 150 }} />
                  <span style={{ left: "30%", top: "34%", width: 110 }} />
                  <span style={{ left: "72%", top: "40%", width: 96 }} />
                </div>
                <div className="sp-ground" />
                <svg className="sp-skyline" viewBox="0 0 360 90" preserveAspectRatio="xMidYMax slice">
                  <path d="M0 90V62h14v-8h10v8h6V48h18v14h8q6-18 14 0h4V40l6-6 6 6v22h10V52h22v10h8q8-20 18 0q6-12 12 0h6V30h4v-8h4v8h4v32h12V46h26v16h6q7-16 15 0h10V54h16v8h14V38h20v24h8q6-14 13 0q6-10 12 0h10V50h16v12h12v28z" />
                </svg>
                <div className="sp-flutes" />
                <div className="sp-sheen" />
              </div>
              <div className="sp-label">
                <Ink size={26}>{step.icon}</Ink>
                <span className="sp-title">{step.title}</span>
              </div>
              {/* Keyboard and screen reader way in: focusing a pane points the panes at it. */}
              <button
                type="button"
                className="sp-hit"
                aria-label={`${step.title}. ${step.detail}`}
                onFocus={() => { touched.current = true; point((i * 2 + 1) / 6, 0.5); }}
                onBlur={rest}
              />
            </li>
          ))}
        </ol>
      </div>
      <p className="sp-caption" aria-hidden>
        <span key={active}>{STEPS[active].detail}</span>
      </p>
    </div>
  );
}
