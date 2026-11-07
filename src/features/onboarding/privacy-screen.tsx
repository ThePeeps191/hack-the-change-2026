"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KEPT: [string, string][] = [
  ["your location while searching", "used to find someone nearby, then deleted the moment you're matched. your partner only sees a rough distance. to find places for quests we look up the area, rounded to about 100 m, on OpenStreetMap."],
  ["your route during a quest", "recorded only while a quest is active, shown only to you, and deleted after 30 days."],
  ["proof photos and videos", "checked by an AI model (Claude by Anthropic, or Google's Gemini), and seen only by the people on that quest."],
  ["your name", "a first name, shown only after you both say yes. we never share your email or contact details."],
  ["mood check-ins", "only ever shown to you, never ranked, and always optional."],
];

export function PrivacyScreen() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      await api.deleteMe();
      router.replace("/");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <TopBar back="/me" title="your data" />
      <div className="flex-1 space-y-4 px-4 pb-6">
        <p className="px-1 text-ink-muted">here&apos;s everything we keep, and why, in plain words.</p>
        <Card className="divide-y divide-line/70 overflow-hidden">
          {KEPT.map(([what, why]) => (
            <div key={what} className="px-4 py-3">
              <p className="font-semibold">{what}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{why}</p>
            </div>
          ))}
        </Card>
        <a className={buttonClass("secondary", "lg", "w-full")} href="/api/me/export" download>download my data</a>
        {error && <Notice tone="danger">that didn&apos;t work. try again?</Notice>}
        {confirming ? (
          <Card className="space-y-2 p-4">
            <p className="font-semibold">delete everything?</p>
            <p className="text-sm text-ink-muted">your routes, photos, check-ins, crews and connections go for good. this can&apos;t be undone.</p>
            <Button className="w-full" disabled={busy} onClick={remove}>{busy ? "deleting…" : "yes, delete it all"}</Button>
            <Button variant="quiet" className="w-full" onClick={() => setConfirming(false)}>keep my account</Button>
          </Card>
        ) : (
          <Button variant="quiet" className="w-full" onClick={() => setConfirming(true)}>delete my data</Button>
        )}
      </div>
    </AppShell>
  );
}
