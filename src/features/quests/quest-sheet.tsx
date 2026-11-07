"use client";
import type { Quest } from "@/lib/contracts";
import { Notice } from "@/components/ui/app-shell";
import { MagneticButton } from "@/components/ui/button";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";
import { Sheet } from "@/components/ui/sheet";
import { useGoFree } from "@/features/matching/use-go-free";
import { useStartRun } from "./use-start-run";

const proofLine = { photo: "One photo", video: "A short video", gps: "Your route" } as const;

// Everything about one quest, and the ways to start it: with someone nearby
// (place quests), with your crew, or on your own (anywhere quests).
export function QuestSheet({ quest, crewId, onClose }: { quest: Quest | null; crewId?: string; onClose: () => void }) {
  const free = useGoFree();
  const run = useStartRun();
  const busy = free.busy || run.busy;
  const q = quest;
  const mapsUrl = q?.lat != null && q.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=walking` : null;

  return (
    <Sheet open={!!q} onClose={onClose} label={q?.title ?? "Quest"}>
      {q && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <QuestIcon type={q.type} size={8} />
            <span>{questTypeLabel[q.type]}</span>
            {q.tags?.slice(0, 2).map((t) => <span key={t} className="text-ink-faint">· {t}</span>)}
          </div>
          <h2 className="mt-2.5 text-[26px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">
            {q.title.charAt(0).toUpperCase() + q.title.slice(1)}
          </h2>
          <p className="mt-2.5 text-[16px] leading-relaxed text-ink-muted">{q.description}</p>

          <dl className="mt-5 grid grid-cols-3 border-y border-[var(--hairline)] py-4 text-center">
            <div>
              <dt className="text-[12px] font-medium text-ink-faint">Takes</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{q.duration_min} min</dd>
            </div>
            <div className="border-x border-[var(--hairline)]">
              <dt className="text-[12px] font-medium text-ink-faint">Proof</dt>
              <dd className="mt-0.5 text-[17px] font-semibold">{proofLine[q.proof]}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-medium text-ink-faint">Coins</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">+{q.coins}</dd>
            </div>
          </dl>

          {q.place_name && (
            <div className="flex items-center gap-3 py-3.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-faint" aria-hidden>
                <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
              <span className="flex-1 text-[15px] font-medium">{q.place_name}</span>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center px-1 text-[15px] font-semibold text-accent">
                  Walk there
                </a>
              )}
            </div>
          )}

          {(free.error || run.error) && <div className="pb-2"><Notice tone="danger">{free.error ?? run.error}</Notice></div>}

          <div className="space-y-1 pt-3">
            {q.type === "anywhere" ? (
              <MagneticButton onClick={() => run.start({ quest_id: q.id })} disabled={busy}>
                {run.busy ? "Starting…" : "Start on my own"}
              </MagneticButton>
            ) : (
              <MagneticButton onClick={free.go} disabled={busy}>
                {free.busy ? "Finding someone…" : "Find someone to do it with"}
              </MagneticButton>
            )}
            {crewId && (
              <button
                onClick={() => run.start({ quest_id: q.id, crew_id: crewId })}
                disabled={busy}
                className="flex min-h-13 w-full items-center justify-center rounded-full text-[16px] font-semibold text-ink hover:bg-sunken disabled:opacity-50"
              >
                Do it with my crew
              </button>
            )}
            {q.type !== "anywhere" && !crewId && (
              <p className="px-6 pt-2 text-center text-[13px] leading-snug text-ink-faint">
                You&apos;ll meet at {q.place_name ?? "the spot"}, a public place, never at each other&apos;s.
              </p>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
