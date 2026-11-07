"use client";
import { useEffect, useRef, useState } from "react";
import { POLL_MS } from "./config";

// Polls fn every `ms` while `enabled`. Keeps the last good value on errors so a
// dropped connection outdoors doesn't blank the screen.
export function usePoll<T>(fn: () => Promise<T>, { enabled = true, ms = POLL_MS } = {}) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

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
