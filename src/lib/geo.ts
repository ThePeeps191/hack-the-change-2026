"use client";
import { CAMPUS_CENTER } from "./config";

export type Position = { lat: number; lng: number; approximate: boolean };

// Asks for the user's location. If GPS is denied, slow or unavailable, falls
// back to campus so the demo still works, and says so via `approximate`.
// Location is personal data: never log it.
export function getPosition(timeoutMs = 6000): Promise<Position> {
  return new Promise((resolve) => {
    const fallback = () => resolve({ ...CAMPUS_CENTER, approximate: true });
    if (typeof navigator === "undefined" || !navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, approximate: false }),
      fallback,
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
