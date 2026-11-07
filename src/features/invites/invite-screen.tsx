"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { QUEST_MINUTES } from "@/lib/config";
import type { Quest } from "@/lib/contracts";
import { getPosition } from "@/lib/geo";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";
import { SkySteps, skyQuiet } from "@/components/ui/sky-steps";
import Link from "next/link";

function InviteQuest({ quest }: { quest: Quest }) {
  return (
    <article className="rounded-[20px] bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        <QuestIcon type={quest.type} size={8} />
        <span>{questTypeLabel[quest.type]}</span>
        <span className="ml-auto font-semibold text-ink tabular-nums">
          +{quest.coins}
        </span>
      </div>
      <h2 className="mt-2.5 text-[22px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">
        {quest.title.charAt(0).toUpperCase() + quest.title.slice(1)}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        {quest.description}
      </p>
      {quest.place_name && (
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--hairline)] pt-3 text-[14px] text-ink-muted">
          <svg
            width="16"
            height="16"
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
          <span className="truncate">{quest.place_name}</span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-faint">
        <span>{quest.duration_min} min</span>
        <span>{quest.proof} proof</span>
      </div>
    </article>
  );
}

const PIN = (
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
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);
const NAME = (
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
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" />
  </svg>
);
const DOOR = (
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
    <path d="M14 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
  </svg>
);

export function InviteScreen() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // Load invite details (quest, host name) and check age.
  useEffect(() => {
    api
      .me()
      .then((u) => {
        if (!u.age_confirmed_at)
          router.replace(`/welcome?next=/invite/${code}`);
      })
      .catch(() => {});
    api
      .inviteDetails(code)
      .then((d) => {
        setQuest(d.quest);
        setHostName(d.host_name);
        setExpired(d.expired);
      })
      .catch(() => {});
  }, [code, router]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      const match = await api.acceptInvite(code, {
        lat: pos.lat,
        lng: pos.lng,
      });
      router.push(match.run_id ? `/quest/${match.run_id}` : "/match");
    } catch (e) {
      setError(
        e instanceof ApiError && e.status !== 0
          ? e.message
          : "Couldn't reach Amble. Check your signal and try again.",
      );
      setBusy(false);
    }
  }

  const duration = quest?.duration_min ?? QUEST_MINUTES;
  const inviterLine = hostName
    ? `${hostName} wants to do a quest with you.`
    : "Someone nearby wants to do a quest with you.";

  return (
    <AppShell nav={false}>
      <Hero
        fill
        className="min-h-dvh pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        <Stars className="opacity-50" />
        <HeroBar
          left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />}
          center="an invite"
        />
        <Hand
          as="h1"
          className="relative mt-6 text-center text-[44px] leading-none font-bold"
        >
          free for {QUEST_MINUTES} min?
        </Hand>
        <p className="relative mx-auto mt-3 max-w-[30ch] text-center text-[16px] leading-snug text-balance text-on-sky/90">
          Someone you just met wants to do a small quest with you.
        </p>
        <div className="mt-9 px-4">
          <SkySteps
            items={[
              {
                badge: PIN,
                title: "Meet at the quest spot",
                detail: "Always somewhere public.",
              },
              {
                badge: NAME,
                title: "First names only",
                detail: "Nothing else is shared.",
              },
              {
                badge: DOOR,
                title: "Leave any time",
                detail: "No need to explain.",
              },
            ]}
          />
        </div>
        <div className="relative mx-auto mt-auto w-full max-w-[400px] space-y-1 px-4 pt-8">
          {error && <Notice tone="warning">{error}</Notice>}
          <MagneticButton variant="onSky" onClick={accept} disabled={busy}>
            {busy ? "Starting…" : "Yes, let's go"}
          </MagneticButton>
          <Link className={skyQuiet} href="/">
            Not this time
          </Link>
        </div>
      </Hero>
    </AppShell>
  );
}
