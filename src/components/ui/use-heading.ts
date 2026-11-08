"use client";
import { useEffect, useRef } from "react";

// Which way the phone is pointing, from its compass: degrees clockwise from
// north that the top of the screen faces. The compass button uses it so its
// needle points at real north.
//
// Android Chrome sends "deviceorientationabsolute" events, where alpha turns
// the other way, so the heading is 360 - alpha. iPhones only share their
// compass after a "motion and orientation" permission prompt, which we chose
// not to show, so on an iPhone (and on a laptop) nothing happens and the
// needle keeps its idle drift.

function headingOf(e: DeviceOrientationEvent): number | null {
  return e.absolute && e.alpha != null ? 360 - e.alpha : null;
}

// Calls onHeading with each new heading. Off when reduced motion is on.
export function useHeading(onHeading: (deg: number) => void) {
  const latest = useRef(onHeading);
  useEffect(() => {
    latest.current = onHeading;
  });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const handle = (e: Event) => {
      const h = headingOf(e as DeviceOrientationEvent);
      if (h == null) return;
      // Turned sideways, the top of the screen faces a different way.
      latest.current((((h + (screen.orientation?.angle ?? 0)) % 360) + 360) % 360);
    };
    window.addEventListener("deviceorientationabsolute", handle);
    return () => window.removeEventListener("deviceorientationabsolute", handle);
  }, []);
}
