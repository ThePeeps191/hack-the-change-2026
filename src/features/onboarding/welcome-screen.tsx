"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Prefs, User } from "@/lib/contracts";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";

const field = "min-h-12 w-full rounded-control border border-line bg-surface px-4 text-ink";

const PACE: { value: NonNullable<Prefs["pace"]>; label: string }[] = [
  { value: "short", label: "Short and easy" },
  { value: "any", label: "Any walk is fine" },
  { value: "brisk", label: "Brisk" },
];

const SOCIAL: { value: NonNullable<Prefs["social"]>; label: string }[] = [
  { value: "chatty", label: "Happy to chat" },
  { value: "side-by-side", label: "Side by side, less talking" },
];

const LANGUAGES = [
  ["en", "English"], ["fr", "Français"], ["es", "Español"], ["zh", "中文"], ["ar", "العربية"],
  ["hi", "हिन्दी"], ["pa", "ਪੰਜਾਬੀ"], ["tl", "Tagalog"], ["uk", "Українська"], ["ko", "한국어"],
];

function Choice<T extends string>({ name, options, value, onPick }: { name: string; options: { value: T; label: string }[]; value: T | undefined; onPick: (v: T) => void }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onPick(o.value)}
          className={`min-h-12 rounded-control border px-4 text-left font-semibold ${value === o.value ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-surface text-ink-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// First-run setup, and the comfort settings page afterwards.
export function WelcomeScreen() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const [me, setMe] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [adult, setAdult] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.me().then((u) => {
      setMe(u);
      setName(u.display_name);
      setAdult(!!u.age_confirmed_at);
      setPrefs(u.prefs);
    }).catch(() => setError(true));
  }, []);

  async function save() {
    setBusy(true);
    setError(false);
    try {
      await api.updateMe({ display_name: name, age_confirmed_at: new Date().toISOString(), prefs });
      router.replace(next);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const firstRun = me && !me.age_confirmed_at;

  return (
    <AppShell nav={false}>
      <TopBar back={firstRun ? undefined : "/me"} title={firstRun ? "Welcome" : "Name and language"} />
      <div className="flex-1 space-y-4 px-4">
        {!me && !error && <Skeleton className="h-64 w-full rounded-card" />}
        {error && <Notice tone="warning">Couldn&apos;t save that. Check your signal and try again?</Notice>}
        {me && (
          <>
            <Card className="space-y-2 p-4">
              <label className="block font-semibold" htmlFor="name">What should people call you?</label>
              <input id="name" className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              <p className="text-[13px] text-ink-muted">A first name is plenty. It&apos;s only shown once you both say yes.</p>
            </Card>
            <Card className="space-y-2 p-4">
              <p className="font-semibold">How do you like to move?</p>
              <Choice name="pace" options={PACE} value={prefs.pace} onPick={(pace) => setPrefs({ ...prefs, pace })} />
              <label className="flex min-h-11 items-center gap-3 px-1 text-[15px]">
                <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={!!prefs.step_free} onChange={(e) => setPrefs({ ...prefs, step_free: e.target.checked })} />
                Step-free places only
              </label>
            </Card>
            <Card className="space-y-2 p-4">
              <p className="font-semibold">How much talking?</p>
              <Choice name="social energy" options={SOCIAL} value={prefs.social} onPick={(social) => setPrefs({ ...prefs, social })} />
            </Card>
            <Card className="space-y-2 p-4">
              <label className="block font-semibold" htmlFor="language">Quests in</label>
              <select id="language" className={field} value={prefs.language ?? "en"} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
                {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </Card>
            {firstRun && (
              <label className="flex min-h-12 items-center gap-3 px-1 font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                I&apos;m 18 or older
              </label>
            )}
          </>
        )}
      </div>
      <div className="px-4 pt-4 pb-6">
        <Button size="lg" onClick={save} disabled={busy || !me || !name.trim() || !adult}>{busy ? "Saving…" : firstRun ? "Let's go" : "Save"}</Button>
      </div>
    </AppShell>
  );
}
