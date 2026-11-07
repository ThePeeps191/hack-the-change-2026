"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { QuestRun } from "@/lib/contracts";

// A quest in progress is never more than one tap away, even after a reload.
export function ResumeBanner() {
  const [run, setRun] = useState<QuestRun | null>(null);

  useEffect(() => {
    api.currentRun().then(setRun).catch(() => {});
  }, []);

  if (!run) return null;
  return (
    <div className="px-4 pt-3">
      <Link href={`/quest/${run.id}`} className="flex min-h-12 items-center justify-between gap-3 rounded-control bg-accent-soft px-4 py-3 font-semibold text-accent-strong">
        <span className="truncate">back to: {run.quest.title}</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
