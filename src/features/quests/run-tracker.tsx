"use client";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

const SEND_EVERY_MS = 20_000;

// Records the walk, only while a quest is active, and sends it in small batches.
// If location is denied this quietly does nothing and the quest still works.
export function RunTracker({ runId, active }: { runId: string; active: boolean }) {
  const buffer = useRef<{ lat: number; lng: number; at: string }[]>([]);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) return;
    const flush = () => {
      const points = buffer.current.splice(0);
      if (points.length) api.sendLocation(runId, points).catch(() => buffer.current.unshift(...points));
    };
    const watch = navigator.geolocation.watchPosition(
      (p) => buffer.current.push({ lat: p.coords.latitude, lng: p.coords.longitude, at: new Date(p.timestamp).toISOString() }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    const timer = setInterval(flush, SEND_EVERY_MS);
    return () => {
      navigator.geolocation.clearWatch(watch);
      clearInterval(timer);
      flush();
    };
  }, [runId, active]);

  return null;
}
