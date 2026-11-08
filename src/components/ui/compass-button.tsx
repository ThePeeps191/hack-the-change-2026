"use client";
import { useRef } from "react";
import { useHeading } from "./use-heading";

// The centre "I'm free" button: a little hand-inked compass on cream paper.
// The needle drifts a few degrees back and forth, like a real compass that is
// never quite still. Tapping it gives the needle a swing that settles. The
// drift is the only idle motion and it doesn't change while loading.
// On an Android phone with a compass, the needle points at real north instead: it turns
// against the way the phone faces, and the drift stops (see use-heading.ts).
// Nested groups so north, the drift and the swing never fight over one transform.
export function CompassButton({ onClick, disabled, label, size = 60 }: { onClick: () => void; disabled?: boolean; label: string; size?: number }) {
  const swing = useRef<SVGGElement>(null);
  const north = useRef<SVGGElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const angle = useRef(0);

  // Turn the needle to north the short way round, so 359° to 1° is a nudge,
  // not a full spin. Set straight on the element: this runs many times a second.
  useHeading((heading) => {
    const delta = ((((-heading - angle.current) % 360) + 540) % 360) - 180;
    angle.current += delta;
    if (north.current) north.current.style.transform = `rotate(${angle.current}deg)`;
    button.current?.classList.add("compass-live");
  });

  function nudge() {
    const g = swing.current;
    if (!g) return;
    g.classList.remove("compass-swing");
    void g.getBoundingClientRect(); // restart the animation if it's mid-swing
    g.classList.add("compass-swing");
  }

  return (
    <button
      ref={button}
      onClick={onClick}
      onPointerDown={nudge}
      disabled={disabled}
      aria-label={label}
      className="compass grid place-items-center rounded-full transition-transform duration-200 ease-[var(--ease-spring)] active:scale-[0.92] disabled:cursor-wait"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <g filter="url(#ink)" stroke="var(--compass-ink)">
          {/* the ring and the four ticks; north's is red */}
          <path d="M30 6.2c13.3-.1 23.9 10.6 23.8 23.9-.1 13.2-10.8 23.8-24 23.7C16.6 53.7 6 43 6.2 29.8 6.3 16.7 16.9 6.3 30 6.2z" strokeWidth="1.5" />
          <path d="M30 9.5v3.6" stroke="var(--compass-red)" strokeWidth="2" />
          <path d="M30 47v3.4M47 30.1h3.4M9.6 29.9H13" strokeWidth="1.4" />
          <g ref={north} className="compass-north">
          <g className="compass-drift">
            <g ref={swing} onAnimationEnd={(e) => e.currentTarget.classList.remove("compass-swing")}>
              <path d="M30 14.5l4.3 15.6h-8.7z" fill="var(--compass-red)" stroke="var(--compass-red)" strokeWidth="1.2" />
              <path d="M30 45.6l4.3-15.5h-8.7z" strokeWidth="1.4" />
              <path d="M27.6 33.4l2.4 7.3M30.6 33.2l1.4 4.6" strokeWidth=".9" />
              <circle cx="30" cy="30.1" r="2.1" fill="var(--compass-paper)" strokeWidth="1.3" />
            </g>
          </g>
          </g>
        </g>
      </svg>
    </button>
  );
}
