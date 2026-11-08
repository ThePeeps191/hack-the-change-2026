"use client";
import { useEffect, useRef } from "react";

// Which way the phone is pointing, from its compass: degrees clockwise from
// north that the top of the screen faces. The compass button uses it so its
// needle points at real north.
//
// Android Chrome sends "deviceorientationabsolute" events, where alpha turns
// the other way, so the heading is 360 - alpha. iPhones send ordinary
// "deviceorientation" events with webkitCompassHeading already in compass
// degrees, but only after the person allows motion access, and Safari only
// lets a page ask from inside a tap (see askForHeading). Laptops send nothing,
// so nothing happens there.

type IOSEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type AskablePermission = { requestPermission?: () => Promise<"granted" | "denied"> };

let asked = false;

// Call from a tap. Only iPhones need it; everywhere else it does nothing.
export function askForHeading() {
  if (asked || typeof DeviceOrientationEvent === "undefined") return;
  asked = true;
  (DeviceOrientationEvent as unknown as AskablePermission).requestPermission?.().catch(() => {});
}

function headingOf(e: DeviceOrientationEvent): number | null {
  const ios = (e as IOSEvent).webkitCompassHeading;
  if (typeof ios === "number" && !Number.isNaN(ios)) return ios;
  if (e.absolute && e.alpha != null) return 360 - e.alpha;
  return null;
}

// Calls onHeading with each new heading. Off when reduced motion is on.
export function useHeading(onHeading: (deg: number) => void) {
  const latest = useRef(onHeading);
  useEffect(() => {
    latest.current = onHeading;
  });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const event = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    const handle = (e: Event) => {
      const h = headingOf(e as DeviceOrientationEvent);
      if (h == null) return;
      // Turned sideways, the top of the screen faces a different way.
      latest.current((((h + (screen.orientation?.angle ?? 0)) % 360) + 360) % 360);
    };
    window.addEventListener(event, handle);
    return () => window.removeEventListener(event, handle);
  }, []);
}
