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
      <Link href={`/quest/${run.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-[20px] bg-toast px-5 py-3 text-[15px] font-semibold text-on-toast shadow-lift">
        <span className="truncate">Back to your quest: {run.quest.title}</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
