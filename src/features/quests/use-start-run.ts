"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { tick } from "@/lib/feedback";

// Start a crew or solo run and go to it. Pair runs come from matching.
export function useStartRun() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(body: { quest_id: string; crew_id?: string }) {
    if (busy) return;
    tick();
    setBusy(true);
    setError(null);
    try {
      const run = await api.startRun(body);
      router.push(`/quest/${run.id}`);
    } catch {
      setError("That didn't start. Check your signal and try again.");
      setBusy(false);
    }
  }

  return { start, busy, error };
}
