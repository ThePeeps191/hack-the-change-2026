import type { ReactNode } from "react";

// Icons that look drawn with a pen, not stamped from an icon font: uneven
// hand-drawn paths, hatching for shade, round ends, and a slight wobble from
// the #ink filter (a little turbulence that nudges the lines, defined once in
// the root layout). They sit bare on the page, never on a tinted tile. Colour
// comes from currentColor, so a sun can be amber ink and the rest plain ink.

export function Ink({ size = 24, className = "", label, children }: { size?: number; className?: string; label?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g filter="url(#ink)">{children}</g>
    </svg>
  );
}

// A sun: a slightly lopsided disc with hatching inside, and rays of uneven length.
export const SunInk = (
  <>
    <path d="M12 8.1c2.3-.1 4 1.6 3.9 3.9-.1 2.3-1.8 3.9-4 3.8-2.2-.1-3.8-1.8-3.7-4 .1-2 1.7-3.6 3.8-3.7z" />
    <path d="M10.1 11.2l2.9 2.9M10.6 9.6l3.6 3.6M12.6 9.4l1.6 1.6" strokeWidth={1.1} />
    <path d="M12 2.4v2.8M12.1 18.9v2.5M2.6 12.1h2.7M18.8 11.9h2.5M5.2 5.3l1.9 1.8M16.9 16.9l1.8 1.8M5.4 18.7l1.8-1.9M17 7.2l1.6-1.7" />
  </>
);

// Sun peeking out from behind a cloud.
export const PartInk = (
  <>
    <path d="M6.6 10.6a3.3 3.3 0 0 1 5.9-3" />
    <path d="M9.6 2.9v1.5M4.1 5.1l1.1 1M2.5 9.7H4" />
    <path d="M8.4 19.7h9.2c2 0 3.6-1.5 3.5-3.5-.1-1.8-1.6-3.2-3.4-3.1-.6-2.4-3-3.9-5.5-3.4-1.9.4-3.3 1.9-3.6 3.8-1.6.1-2.9 1.5-2.8 3.1 0 1.7 1.2 3.1 2.6 3.1z" />
  </>
);

// A cloud with a little rain under it.
export const CloudInk = (
  <>
    <path d="M7.3 15.9h9.6c2.1 0 3.7-1.6 3.6-3.6-.1-1.9-1.7-3.3-3.6-3.2-.7-2.6-3.3-4.2-5.9-3.5-2 .5-3.5 2.1-3.8 4.1-1.7.1-3 1.5-3 3.2 0 1.7 1.4 3 3.1 3z" />
    <path d="M7.4 11.9l2.2 2.2M9.8 12.4l1.6 1.6" strokeWidth={1.1} />
    <path d="M9.1 18.6l-.9 2M13.1 18.6l-.9 2M17.1 18.6l-.9 2" />
  </>
);

// Two footprints, left then right, for distance walked: each a whole sole,
// wide at the toes and narrow at the arch, so it reads at 16 px.
export const StepsInk = (
  <>
    <path d="M7.4 2.8c1.8 0 2.8 1.7 2.6 3.8-.2 1.7-1 2.6-1.1 4-.1 1.5.5 2.6-.3 3.6-.7.9-2.2.9-2.9-.1-.7-1-.1-2.3-.3-3.8-.2-1.6-1.1-2.7-1-4.3.2-1.9 1.3-3.2 3-3.2z" />
    <path d="M16.6 8.3c1.8 0 2.8 1.7 2.6 3.8-.2 1.7-1 2.6-1.1 4-.1 1.5.5 2.6-.3 3.6-.7.9-2.2.9-2.9-.1-.7-1-.1-2.3-.3-3.8-.2-1.6-1.1-2.7-1-4.3.2-1.9 1.3-3.2 3-3.2z" />
  </>
);

// Two people, one a step behind the other, for people met.
export const PeopleInk = (
  <>
    <path d="M9 10.6c1.6 0 2.9-1.3 2.8-2.9 0-1.6-1.3-2.9-2.9-2.8-1.6 0-2.8 1.3-2.7 2.9 0 1.6 1.2 2.8 2.8 2.8z" />
    <path d="M3.6 19.3c.3-3.2 2.6-5.4 5.5-5.3 2.8 0 5 2.1 5.3 5.2" />
    <path d="M15.4 4.9c1.4 0 2.5 1.1 2.4 2.6 0 1.4-1.1 2.5-2.5 2.4" />
    <path d="M16.6 13.7c2.2.4 3.7 2.4 3.9 5.2" />
  </>
);

// A small compass, the same idea as the centre button.
export const CompassInk = (
  <>
    <path d="M12 3.2c4.9-.1 8.8 3.9 8.8 8.8 0 4.9-4 8.8-8.9 8.8-4.8 0-8.7-4-8.7-8.9.1-4.8 4-8.7 8.8-8.7z" />
    <path d="M12 6.6l2 5.4h-4z" fill="currentColor" fillOpacity=".35" />
    <path d="M12 17.4l2-5.4h-4z" />
  </>
);

// A map pin with a dot, slightly lopsided.
export const PinInk = (
  <>
    <path d="M12 21.1c-3.6-3.4-6.6-6.9-6.5-10.6.1-3.7 3-6.4 6.6-6.4 3.5.1 6.3 2.9 6.3 6.5 0 3.6-2.9 7.1-6.4 10.5z" />
    <path d="M12.1 8.4c1.1 0 2 .9 2 2 0 1.1-1 2-2.1 2-1.1-.1-1.9-1-1.9-2.1.1-1 1-1.9 2-1.9z" />
  </>
);

// A flag, drawn in ink: a pole leaning a touch, a wavy cloth, and a tuft of
// ground at its foot. Held flags get hatching and a faint wash on the cloth,
// and the cloth (with its hatching) sways from the pole (.flag-fly). Open
// flags are an empty outline. As a string too, for map pins built as HTML.
const FLAG_POLE = "M6.3 21.1c-.2-5.6-.1-11.3.1-17";
const FLAG_GROUND = "M3.7 21.3c1.7-.5 3.5-.5 5.3 0";
const FLAG_CLOTH = "M6.4 4.3c2.1-.9 4 .6 6.1.1 1.6-.4 3.1-.9 4.7-.4-.8 1.6-1.4 3.1-.6 4.8-1.7-.4-3.2.2-4.8.6-2 .4-3.6-.8-5.5.1";
const FLAG_HATCH = "M8.2 5.4l2.9 3.3M10.9 5.1l3 3.2M13.7 4.9l2.5 2.7";

export function inkFlagMarkup(held: boolean, fill = "currentColor") {
  return `<g filter="url(#ink)"><path d="${FLAG_GROUND}"/><path d="${FLAG_POLE}"/><g class="${held ? "flag-fly" : ""}" style="transform-box:fill-box;transform-origin:0% 50%"><path d="${FLAG_CLOTH}" fill="${held ? fill : "none"}" fill-opacity="${held ? 0.2 : 0}"/>${held ? `<path d="${FLAG_HATCH}" stroke-width="1.1"/>` : ""}</g></g>`;
}

export function inkFlagSvg(held: boolean, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inkFlagMarkup(held)}</svg>`;
}

export function InkFlag({ held, color, size = 22, className = "" }: { held: boolean; color: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: inkFlagMarkup(held, color) }}
    />
  );
}

// A door frame with an arrow walking out of it, for leaving a crew. The frame
// is open on the right, with a little hatching for shade on the wall side. The
// arrow is its own group (.leave-arrow) so a button can nudge it outward.
export const LeaveInk = (
  <>
    <path d="M12.7 7.3c0-1-.1-1.9-.2-2.8-.1-.4-.4-.5-.8-.6-2.3-.2-4.6-.1-6.8.1-.4.1-.6.3-.6.7-.2 5-.2 9.9.1 14.9 0 .4.3.6.7.6 2.2.2 4.5.2 6.7 0 .4 0 .6-.3.7-.7.1-.9.1-1.8.1-2.7" />
    <path d="M6.3 6.6l1.8 1.8M6.3 15.4l1.5 1.5" strokeWidth={1.1} />
    <g className="leave-arrow">
      <path d="M9.2 12.3c3.2-.4 6.6-.3 10-.2" />
      <path d="M16.5 8.9c1 1.1 1.9 2.1 2.7 3.1-.8 1.1-1.8 2.1-2.8 3.2" />
    </g>
  </>
);
