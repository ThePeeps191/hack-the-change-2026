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

// Straight-line metres between two points (haversine).
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
