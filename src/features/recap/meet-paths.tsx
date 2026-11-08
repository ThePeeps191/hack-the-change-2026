"use client";
import { useId } from "react";

// The top of the recap: what just happened, drawn. Two trails of footsteps,
// yours from the left and your partner's from the right, wander in and meet
// in the middle, where a little sun blooms: you met and did the quest. On a
// solo quest only your trail walks in. It's a picture of the meeting, not a
// map, so it doesn't pretend to be your real route.
//
// How it moves: each dotted trail sits under a mask whose line draws itself
// (the `draw` keyframes), so the footsteps appear in order. A dot rides the
// tip of each trail (SVG animateMotion), and when both arrive the sun blooms
// (the `rm-` CSS). With `still` (reduced motion) it's just the finished picture.

const LEFT = "M22 108 C 58 118, 66 74, 102 82 S 136 70, 148 66";
const RIGHT = "M318 108 C 282 118, 274 74, 238 82 S 204 70, 192 66";
const WALK = "2.4s";

export function MeetPaths({ partner, still }: { partner?: string | null; still: boolean }) {
  const id = useId().replace(/:/g, "");
  const trails = partner ? [{ d: LEFT, who: "you", x: 22 }, { d: RIGHT, who: partner, x: 318 }] : [{ d: LEFT, who: "you", x: 22 }];

  return (
    <svg viewBox="0 0 340 150" className={`rm mx-auto mt-2 block w-full max-w-[360px] px-3 ${still ? "rm-still" : ""}`} aria-hidden>
      <defs>
        {trails.map((t, i) => (
          <mask key={i} id={`${id}-m${i}`} maskUnits="userSpaceOnUse">
            <path d={t.d} className="rm-reveal" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="1" />
          </mask>
        ))}
      </defs>

      {trails.map((t, i) => (
        <g key={i}>
          {/* the footsteps */}
          <path d={t.d} mask={`url(#${id}-m${i})`} fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 9" />
          {/* where each of you set off from */}
          <circle cx={t.x} cy="108" r="4" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" />
          <text x={t.x} y="132" textAnchor="middle" className="rm-name">{t.who}</text>
          {/* you, walking: a dot on the tip of the trail */}
          {!still && (
            <circle r="5.5" fill="#fff" className="rm-walker">
              <animateMotion dur={WALK} begin=".2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.25 1" path={t.d} />
            </circle>
          )}
        </g>
      ))}

      {/* where you met: a sun blooms */}
      <g transform="translate(170 60)">
        <g className="rm-rays" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          {Array.from({ length: 8 }, (_, k) => (
            <path key={k} d="M0 -30v-8" transform={`rotate(${k * 45})`} />
          ))}
        </g>
        <g className="rm-bloom">
          <circle r="22" fill="rgb(255 255 255 / .2)" stroke="rgb(255 255 255 / .75)" strokeWidth="1.5" />
          <path filter="url(#ink)" d="M0 -9.5c5.3-.2 9.6 4 9.4 9.4-.2 5.3-4.3 9.3-9.6 9.1C-5.4 8.8-9.3 4.7-9.2-.6-9 -5.6-5.1-9.3 0-9.5z" fill="#ffe2a8" stroke="#fff" strokeWidth="1.6" />
        </g>
      </g>
    </svg>
  );
}
