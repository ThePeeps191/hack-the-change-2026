"use client";
import { motion } from "motion/react";
import { tick } from "@/lib/feedback";

// An on/off switch with a springy thumb. The whole row is the tap target.
export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => {
        tick(0.7);
        onChange(!checked);
      }}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
    >
      <span className="flex-1">
        <span className="block text-[16px] font-medium">{label}</span>
        {hint && <span className="block text-[13px] leading-snug text-ink-muted">{hint}</span>}
      </span>
      <span className={`flex h-[30px] w-[50px] shrink-0 rounded-full p-[3px] transition-colors duration-200 ${checked ? "justify-end bg-accent" : "justify-start bg-line"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className="size-6 rounded-full bg-white shadow-card" />
      </span>
    </button>
  );
}
