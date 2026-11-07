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
      <Link href={`/quest/${run.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-[20px] bg-accent px-5 py-3 text-on-accent shadow-press transition-transform active:scale-[0.98]">
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold tracking-[0.06em] uppercase opacity-80">Back to your quest</span>
          <span className="block truncate font-[family-name:var(--font-hand)] text-[20px] leading-tight font-bold">{run.quest.title}</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </div>
  );
}
