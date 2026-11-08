"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { tick } from "@/lib/feedback";
import { getPosition } from "@/lib/geo";

// "I'm free": find your spot (falling back to campus if GPS is denied), tell
// the server, and go to matching. Shared by Home and the centre nav button.
export function useGoFree() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    tick();
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      await api.setFree(pos.lat, pos.lng);
      router.push(pos.approximate ? "/match?approx=1" : "/match");
    } catch (e) {
      // 403 is a safety rule (verified email, daylight) with its own message.
      setError(e instanceof ApiError && e.status === 403 ? e.message : "Couldn't reach Amble just now. Check your signal and try again.");
      setBusy(false);
    }
  }

  return { go, busy, error };
}
