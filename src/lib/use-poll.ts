"use client";
import { useEffect, useRef, useState } from "react";
import { POLL_MS } from "./config";

// Polls fn every `ms` while `enabled`, and stops for good once `until(data)` is
// true. Keeps the last good value on errors so a dropped connection outdoors
// doesn't blank the screen.
export function usePoll<T>(
  fn: () => Promise<T>,
  { enabled = true, ms = POLL_MS, until }: { enabled?: boolean; ms?: number; until?: (data: T) => boolean } = {},
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  const untilRef = useRef(until);
  useEffect(() => {
    fnRef.current = fn;
    untilRef.current = until;
  });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const next = await fnRef.current();
        if (!alive) return;
        setData(next);
        setError(null);
        if (untilRef.current?.(next)) return;
      } catch (e) {
        if (alive) setError(e as Error);
      }
      if (alive) timer = setTimeout(tick, ms);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, ms]);

  return { data, error };
}
