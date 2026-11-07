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
    <div role="tablist" aria-label={label} className="flex rounded-[14px] bg-sunken p-1">
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
            className={`relative flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[14px] font-semibold transition-colors ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[10px] bg-surface shadow-card"
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
