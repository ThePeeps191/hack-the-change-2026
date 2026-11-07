import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-card bg-surface border border-line/70 shadow-card ${className}`} {...props} />;
}

export function Chip({ className = "", tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "success" | "danger" | "warning" }) {
  const tones = {
    neutral: "bg-sunken text-ink-muted",
    accent: "bg-accent-soft text-accent-strong",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-[13px] font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-bold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-base font-semibold text-ink-muted">{unit}</span>}
      </span>
      <span className="text-[13px] text-ink-muted">{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-control bg-sunken ${className}`} aria-hidden />;
}
