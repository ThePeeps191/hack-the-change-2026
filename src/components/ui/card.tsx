import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-card bg-surface shadow-card ${className}`} {...props} />;
}

// A section: a small heading and rows separated by inset hairlines, no box.
export function Section({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-1 flex items-baseline justify-between px-5">
          {title && <h2 className="font-[family-name:var(--font-body)] text-[13px] font-semibold tracking-[0.01em] text-ink-faint">{title}</h2>}
          {action}
        </div>
      )}
      <div className="rows">{children}</div>
    </section>
  );
}

export function Stat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-[family-name:var(--font-display)] text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
        {value}
        {unit && <span className="ml-1 text-[15px] font-medium text-ink-muted">{unit}</span>}
      </span>
      <span className="text-[13px] text-ink-muted">{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-[10px] ${className}`} aria-hidden />;
}

// Kept for older screens: plain text with a dot instead of a pill.
export function Chip({ className = "", tone = "neutral", children }: { className?: string; tone?: "neutral" | "accent" | "success" | "danger" | "warning"; children: ReactNode }) {
  const tones = { neutral: "bg-ink-faint", accent: "bg-accent", success: "bg-success", danger: "bg-danger", warning: "bg-warning" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted ${className}`}>
      <span className={`size-1.5 rounded-full ${tones[tone]}`} />
      {children}
    </span>
  );
}
