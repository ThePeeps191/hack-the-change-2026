import type { QuestType } from "@/lib/contracts";

// Quest types get a shape as well as a colour, so they read in sunlight and
// for colour-blind players: local = circle, anywhere = triangle, event = square.
export const questTypeLabel: Record<QuestType, string> = {
  local: "nearby",
  anywhere: "anywhere",
  event: "event",
};

export function QuestIcon({ type, size = 28 }: { type: QuestType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0">
      {type === "local" && (
        <>
          <circle cx="14" cy="14" r="12" fill="var(--color-local)" />
          <circle cx="14" cy="12" r="4" fill="var(--color-surface)" />
          <path d="M14 16v5" stroke="var(--color-surface)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {type === "anywhere" && (
        <>
          <path d="M14 2.5l12 21.5H2z" fill="var(--color-anywhere)" strokeLinejoin="round" />
          <path d="M9 19l4-6 3 4 2-2 2 4" stroke="var(--color-surface)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {type === "event" && (
        <>
          <rect x="2.5" y="2.5" width="23" height="23" rx="5" fill="var(--color-event)" />
          <path d="M8 11h12M8 15h8" stroke="var(--color-surface)" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
