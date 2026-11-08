"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Quest } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { questTypeLabel } from "@/components/ui/quest-icon";
import {
  categoryLabel,
  categoryOf,
  CategoryIcon,
} from "@/components/ui/quest-glyph";
import { Ink, PeopleInk } from "@/components/ui/ink";
import { Sheet } from "@/components/ui/sheet";
import { ShareLink } from "@/features/invites/share-link";
import { useGoFree } from "@/features/matching/use-go-free";
import { useStartRun } from "./use-start-run";
import { QuestDistance } from "./quest-distance";

const proofLine = {
  photo: "One photo",
  video: "A short video",
  gps: "Your route",
} as const;

// Everything about one quest, and the ways to start it: with someone nearby
// (place quests), with your crew, or on your own (anywhere quests).
export function QuestSheet({
  quest,
  crewId,
  onClose,
}: {
  quest: Quest | null;
  crewId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const free = useGoFree();
  const run = useStartRun();
  const [airdropUrl, setAirdropUrl] = useState<string | null>(null);
  const [airdropBusy, setAirdropBusy] = useState(false);
  const [airdropError, setAirdropError] = useState<string | null>(null);
  const busy = free.busy || run.busy;
  const q = quest;

  // Reset AirDrop state when the sheet opens for a different quest (using useEffect, not in render).
  useEffect(() => {
    setAirdropUrl(null); // eslint-disable-line react-hooks/set-state-in-effect -- reset when a different quest opens
    setAirdropError(null);
  }, [q?.id]);

  // While the shared link is live, the host already said yes by making it, so
  // watch for the other person to accept and take the host to the quest too.
  const { data: liveMatch } = usePoll(api.match, {
    enabled: !!airdropUrl,
    ms: 2000,
    until: (m) => m?.status === "accepted" && m.run_id != null,
  });
  useEffect(() => {
    if (airdropUrl && liveMatch?.status === "accepted" && liveMatch.run_id) {
      router.push(`/quest/${liveMatch.run_id}`);
    }
  }, [airdropUrl, liveMatch, router]);

  async function airdropQuest(questId: string) {
    setAirdropBusy(true);
    setAirdropError(null);
    try {
      // Only makes the link. Safari opens the share sheet (and AirDrop) only
      // straight from a tap, and the wait for the server uses that tap up, so
      // the Share button in the panel below opens it.
      const { url } = await api.createInvite(questId);
      setAirdropUrl(url);
      setAirdropBusy(false);
      requestAnimationFrame(() => document.getElementById("quest-share")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch (e) {
      setAirdropError(
        e instanceof ApiError && e.status === 403
          ? e.message
          : "Couldn't make a link just now. Try again?",
      );
      setAirdropBusy(false);
    }
  }

  const mapsUrl =
    q?.lat != null && q.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=walking`
      : null;

  return (
    <Sheet open={!!q} onClose={onClose} label={q?.title ?? "Quest"}>
      {q && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
            <CategoryIcon category={categoryOf(q)} size={20} className="text-ink" />
            <span>
              {categoryLabel[categoryOf(q)]}
              <span className="text-ink-faint"> · {questTypeLabel[q.type]}</span>
            </span>
          </div>
          <h2 className="name-serif mt-2.5 text-[27px] leading-[1.12] text-pretty">
            {q.title.charAt(0).toUpperCase() + q.title.slice(1)}
          </h2>
          <p className="mt-2.5 text-[16px] leading-relaxed text-ink-muted">
            {q.description}
          </p>

          <dl className="mt-5 grid grid-cols-3 border-y border-[var(--hairline)] py-4 text-center">
            <div>
              <dt className="text-[12px] font-medium text-ink-faint">Takes</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">
                {q.duration_min} min
              </dd>
              <dd className="text-[12px] font-medium text-ink-faint tabular-nums empty:hidden"><QuestDistance quest={q} prefix="" /></dd>
            </div>
            <div className="border-x border-[var(--hairline)]">
              <dt className="text-[12px] font-medium text-ink-faint">Proof</dt>
              <dd className="mt-0.5 text-[17px] font-semibold">
                {proofLine[q.proof]}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-medium text-ink-faint">Coins</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">
                +{q.coins}
              </dd>
            </div>
          </dl>

          {q.place_name && (
            <div className="flex items-center gap-3 py-3.5">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-ink-faint"
                aria-hidden
              >
                <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
              <span className="flex-1 text-[15px] font-medium">
                {q.place_name}
              </span>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center px-1 text-[15px] font-semibold text-accent"
                >
                  Walk there
                </a>
              )}
            </div>
          )}

          {(free.error || run.error || airdropError) && (
            <div className="pb-2">
              <Notice tone="danger">
                {free.error ?? run.error ?? airdropError}
              </Notice>
            </div>
          )}

          <div className="space-y-1 pt-3">
            {q.type === "anywhere" ? (
              <MagneticButton
                onClick={() => run.start({ quest_id: q.id })}
                disabled={busy}
              >
                {run.busy ? "Starting…" : "Start on my own"}
              </MagneticButton>
            ) : (
              <MagneticButton onClick={() => free.go(q.id)} disabled={busy}>
                {free.busy ? "Finding someone…" : "Find someone to do it with"}
              </MagneticButton>
            )}
            {q.type !== "anywhere" && (
              <button
                onClick={() => airdropQuest(q.id)}
                disabled={busy || airdropBusy}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-ink hover:bg-sunken disabled:opacity-50"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                {airdropBusy ? "Making link…" : "Share this quest"}
              </button>
            )}
            {crewId && (
              <button
                onClick={() => run.start({ quest_id: q.id, crew_id: crewId })}
                disabled={busy}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-ink hover:bg-sunken disabled:opacity-50"
              >
                <Ink size={18}>{PeopleInk}</Ink>
                Do it with my crew
              </button>
            )}
          </div>

          {airdropUrl && (
            <div id="quest-share" className="mt-4 rounded-[20px] border border-[var(--hairline)] p-4">
              <p className="text-[16px] font-semibold">Send this to them</p>
              <p className="mt-1 mb-3 text-[14px] leading-snug text-ink-muted">
                Share opens AirDrop and your messages. When they say yes, you&apos;ll both get this quest. The link lasts 30 minutes.
              </p>
              <ShareLink
                url={airdropUrl}
                title={`Do "${q.title}" with me on Amble`}
              />
              <ButtonLink className="mt-2 w-full" variant="secondary" href="/match">
                Wait for them
              </ButtonLink>
            </div>
          )}

          {q.type !== "anywhere" && !airdropUrl && (
            <p className="px-6 pt-3 text-center text-[13px] leading-snug text-ink-faint">
              You&apos;ll meet at {q.place_name ?? "the spot"}, a public place,
              never at each other&apos;s.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
