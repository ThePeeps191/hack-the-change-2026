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
import { categoryLabel, categoryOf, CategoryIcon, Coin } from "@/components/ui/quest-glyph";

// Moved outside component to avoid recreating on every render.
function InviteQuest({ quest }: { quest: Quest }) {
  return (
    <article className="rounded-[20px] bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        <CategoryIcon category={categoryOf(quest)} size={20} className="text-ink" />
        <span>{categoryLabel[categoryOf(quest)]}</span>
        <span className="ml-auto flex items-center gap-1 font-semibold text-ink tabular-nums">
          <Coin size={14} />
          {quest.coins}
          <span className="sr-only"> coins</span>
        </span>
      </div>
      <h2 className="name-serif mt-2.5 text-[23px] leading-[1.12] text-pretty">
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

export function InviteScreen() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [own, setOwn] = useState(false);
  const [expired, setExpired] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load invite details (quest, host name) and check age.
  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      try {
        // Check age first
        const user = await api.me();
        if (!user.age_confirmed_at) {
          router.replace(`/welcome?next=/invite/${code}`);
          return;
        }

        // Load invite details
        const details = await api.inviteDetails(code);
        if (mounted) {
          setQuest(details.quest);
          setHostName(details.host_name);
          setOwn(details.host_id === user.id);
          setExpired(details.expired);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setDetailsError("This invite isn't valid or has expired. Ask them for a new one?");
          setLoading(false);
        }
      }
    };

    loadInvite();

    return () => {
      mounted = false;
    };
  }, [code, router]);

  const [copied, setCopied] = useState(false);
  async function share() {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: "A quest on Amble", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {}
  }

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
  const inviterLine = own
    ? "This is your invite. Send the link to the person you just met, and you'll both get this quest."
    : hostName
      ? `${hostName} wants to do a quest with you.`
      : "Someone nearby wants to do a quest with you.";

  // If we got an error loading invite details, show it
  if (detailsError) {
    return (
      <AppShell nav={false}>
        <Hero className="pb-10">
          <HeroBar
            left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />}
            center="an invite"
          />
          <Hand
            as="h1"
            className="mt-6 text-center text-[40px] leading-none font-bold"
          >
            oops
          </Hand>
          <p className="mx-auto mt-3 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/95">
            {detailsError}
          </p>
        </Hero>
        <div className="flex flex-1 flex-col" />
        <div className="space-y-2 px-4 pt-6 pb-6">
          <ButtonLink size="lg" href="/">
            Back to today
          </ButtonLink>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell nav={false}>
      <Hero className="pb-10">
        <HeroBar
          left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />}
          center="an invite"
        />
        <Hand
          as="h1"
          className="mt-6 text-center text-[40px] leading-none font-bold"
        >
          {own ? "your invite" : `free for ${duration} min?`}
        </Hand>
        <p className="mx-auto mt-3 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/95">
          {inviterLine}
        </p>
      </Hero>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-6">
        {quest && <InviteQuest quest={quest} />}
        <p className="rounded-[24px] bg-surface p-5 text-[15px] leading-snug text-ink-muted shadow-card">
          You&apos;ll meet at the quest spot, somewhere public. You only share a
          first name, and you can leave any time.
        </p>
      </div>
      <div className="space-y-2 px-4 pt-6 pb-6">
        {error && <Notice tone="warning">{error}</Notice>}
        {own && !expired ? (
          <>
            <MagneticButton onClick={share}>{copied ? "Link copied" : "Share the link"}</MagneticButton>
            <ButtonLink size="lg" variant="quiet" href="/">
              Back to today
            </ButtonLink>
          </>
        ) : expired ? (
          <>
            <p className="pb-2 text-center text-[15px] text-ink-muted">
              This invite has ended. Ask them for a new one?
            </p>
            <ButtonLink size="lg" href="/">
              Back to today
            </ButtonLink>
          </>
        ) : (
          <>
            <MagneticButton onClick={accept} disabled={busy || loading}>
              {busy ? "Starting…" : "Yes, let's go"}
            </MagneticButton>
            <ButtonLink size="lg" variant="quiet" href="/">
              Not this time
            </ButtonLink>
          </>
        )}
      </div>
    </AppShell>
  );
}
