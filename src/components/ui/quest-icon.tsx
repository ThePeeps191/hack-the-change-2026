import type { QuestType } from "@/lib/contracts";

// Quest types are a small coloured mark plus a word, never a box. Each mark
// has its own shape so it reads in sun and for colour-blind players:
// nearby = circle, anywhere = triangle, event = square.
export const questTypeLabel: Record<QuestType, string> = {
  local: "Nearby",
  anywhere: "Anywhere",
  event: "Event",
};

export function QuestIcon({ type, size = 10, className = "" }: { type: QuestType; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden className={`shrink-0 ${className}`}>
      {type === "local" && <circle cx="5" cy="5" r="5" fill="var(--color-local)" />}
      {type === "anywhere" && <path d="M5 .4l4.8 8.8H.2z" fill="var(--color-anywhere)" />}
      {type === "event" && <rect x=".5" y=".5" width="9" height="9" rx="2" fill="var(--color-event)" />}
    </svg>
  );
}

export function QuestKind({ type, className = "" }: { type: QuestType; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted ${className}`}>
      <QuestIcon type={type} size={8} />
      {questTypeLabel[type]}
    </span>
  );
}
