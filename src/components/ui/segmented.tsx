"use client";
import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { tick } from "@/lib/feedback";

// One control instead of a row of pills: a quiet track with an indicator that
// slides between options on a spring, with a detent tick.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="flex rounded-[15px] bg-[#e4e4de] p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] dark:bg-[#0a0b0a] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.5),0_0_0_1px_rgb(255_255_255/0.05)]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) tick(0.7);
              onChange(o.value);
            }}
            className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[11px] px-2 text-[14px] font-semibold transition-colors ${active ? "text-ink" : "text-ink/75 hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[11px] bg-white shadow-[0_1px_1px_rgb(0_0_0/0.06),0_3px_10px_rgb(0_0_0/0.1)] dark:bg-[#33373a] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_2px_8px_rgb(0_0_0/0.5)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
