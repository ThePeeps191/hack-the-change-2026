"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { distance, walkMinutes } from "@/lib/format";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, Chip } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export function MatchScreen() {
  const router = useRouter();
  const approx = useSearchParams().get("approx") === "1";
  const [acting, setActing] = useState(false);
  const { data: match, error } = usePoll(api.match, {
    ms: 1500,
    until: (m) => m != null && (m.status !== "pending" && (m.status !== "accepted" || m.run_id != null)),
  });
  const buzzed = useRef<string | null>(null);

  const state =
    match === undefined || match === null
      ? "searching"
      : match.status === "accepted"
        ? "matched"
        : match.status === "pending"
          ? match.you_accepted
            ? "waiting"
            : "found"
          : "ended";

  useEffect(() => {
    if (state === "found" && buzzed.current !== "found") buzz(40);
    if (state === "matched" && buzzed.current !== "matched") buzz([30, 60, 30]);
    buzzed.current = state;
  }, [state]);

  async function cancel() {
    setActing(true);
    await api.clearFree().catch(() => {});
    router.push("/");
  }

  async function respond(accept: boolean) {
    if (!match) return;
    setActing(true);
    try {
      if (accept) await api.acceptMatch(match.id);
      else {
        await api.declineMatch(match.id);
        router.push("/");
      }
    } finally {
      setActing(false);
    }
  }

  return (
    <AppShell nav={false}>
      <TopBar back="/" title={state === "matched" ? "matched" : "finding someone"} />
      {approx && state === "searching" && (
        <div className="px-4"><Notice tone="warning">we couldn&apos;t get your location, so we&apos;re using the middle of campus. turn on location for closer matches.</Notice></div>
      )}
      {error && <div className="px-4 pt-2"><Notice tone="warning">signal&apos;s patchy. we&apos;ll keep trying.</Notice></div>}

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {state === "searching" && (
          <>
            <div className="relative grid size-48 place-items-center">
              <span className="absolute inset-8 rounded-full border-2 border-accent/40 animate-[ripple_2.4s_ease-out_infinite]" />
              <span className="absolute inset-8 rounded-full border-2 border-accent/40 animate-[ripple_2.4s_ease-out_1.2s_infinite]" />
              <Mascot mood="searching" size={84} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">looking around for you</h1>
            <p className="mt-2 max-w-[30ch] text-ink-muted">anyone free within a short walk. this usually takes under a minute.</p>
          </>
        )}

        {state === "found" && match && (
          <div className="w-full animate-[rise_var(--duration-slow)_var(--ease-spring)]">
            <Mascot mood="matched" size={84} className="mx-auto" />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">someone&apos;s free nearby</h1>
            <p className="mt-2 text-ink-muted">
              {match.distance_m != null ? `about ${walkMinutes(match.distance_m)} min away (${distance(match.distance_m)}). ` : ""}
              you&apos;ll see their name once you both say yes.
            </p>
            <Card className="mt-5 p-4 text-left text-sm text-ink-muted">
              you&apos;ll meet at the quest spot, somewhere public, never at each other&apos;s location.
            </Card>
          </div>
        )}

        {state === "waiting" && (
          <>
            <Mascot mood="thinking" size={84} />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">you said yes</h1>
            <p className="mt-2 text-ink-muted">waiting for them to say yes too…</p>
          </>
        )}

        {state === "matched" && match?.partner && (
          <div className="animate-[rise_var(--duration-slow)_var(--ease-spring)]">
            <Mascot mood="cheer" size={96} className="mx-auto" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">you and {match.partner.display_name}</h1>
            <p className="mt-2 text-ink-muted">your quest is ready. head to the spot and say hi.</p>
            <div className="mt-4 flex justify-center gap-2"><Chip tone="success">both said yes</Chip></div>
          </div>
        )}

        {state === "ended" && (
          <>
            <Mascot mood="sleepy" size={84} />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">that one slipped away</h1>
            <p className="mt-2 text-ink-muted">no worries. try again whenever you&apos;re free.</p>
          </>
        )}
      </div>

      <div className="space-y-2 px-4 pb-6">
        {state === "searching" && <Button variant="secondary" size="lg" onClick={cancel} disabled={acting}>never mind</Button>}
        {state === "found" && (
          <>
            <Button size="lg" onClick={() => respond(true)} disabled={acting}>yes, let&apos;s go</Button>
            <Button variant="quiet" size="lg" onClick={() => respond(false)} disabled={acting}>not this time</Button>
          </>
        )}
        {state === "waiting" && <Button variant="secondary" size="lg" onClick={cancel}>cancel</Button>}
        {state === "matched" && match?.run_id && <ButtonLink size="lg" href={`/quest/${match.run_id}`}>see our quest</ButtonLink>}
        {state === "ended" && <ButtonLink size="lg" href="/">back home</ButtonLink>}
      </div>
    </AppShell>
  );
}
