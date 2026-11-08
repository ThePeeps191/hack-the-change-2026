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
    <div className="px-4 pt-4">
      <Link href={`/quest/${run.id}`} className="flex min-h-14 items-center justify-between gap-3 tb tb-primary rounded-[20px] px-5 py-3 text-on-accent transition-transform motion-safe:active:scale-[0.98]">
        <span className="min-w-0">
          <span className="block text-[13px] font-medium">Back to your quest</span>
          <span className="font-semibold block truncate text-[18px] leading-tight">{run.quest.title.charAt(0).toUpperCase() + run.quest.title.slice(1)}</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </div>
  );
}
