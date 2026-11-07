"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Prefs, User } from "@/lib/contracts";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";

const field = "min-h-12 w-full rounded-control border border-line bg-surface px-4 text-ink";

const PACE: { value: NonNullable<Prefs["pace"]>; label: string }[] = [
  { value: "any", label: "any walk is fine" },
  { value: "short", label: "short distances" },
  { value: "step-free", label: "step-free only" },
];

const SOCIAL: { value: NonNullable<Prefs["social"]>; label: string }[] = [
  { value: "chatty", label: "happy to chat" },
  { value: "side-by-side", label: "side by side, less talking" },
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
      router.replace("/");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const firstRun = me && !me.age_confirmed_at;

  return (
    <AppShell nav={false}>
      <TopBar back={firstRun ? undefined : "/me"} title={firstRun ? "welcome" : "comfort settings"} />
      <div className="flex-1 space-y-4 px-4">
        {!me && !error && <Skeleton className="h-64 w-full rounded-card" />}
        {error && <Notice tone="warning">couldn&apos;t save that. check your signal and try again?</Notice>}
        {me && (
          <>
            <Card className="space-y-2 p-4">
              <label className="block font-semibold" htmlFor="name">what should people call you?</label>
              <input id="name" className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              <p className="text-[13px] text-ink-muted">a first name is plenty. it&apos;s only shown once you both say yes.</p>
            </Card>
            <Card className="space-y-2 p-4">
              <p className="font-semibold">how do you like to move?</p>
              <Choice name="pace" options={PACE} value={prefs.pace} onPick={(pace) => setPrefs({ ...prefs, pace })} />
            </Card>
            <Card className="space-y-2 p-4">
              <p className="font-semibold">how much talking?</p>
              <Choice name="social energy" options={SOCIAL} value={prefs.social} onPick={(social) => setPrefs({ ...prefs, social })} />
            </Card>
            <Card className="space-y-2 p-4">
              <label className="block font-semibold" htmlFor="language">quests in</label>
              <select id="language" className={field} value={prefs.language ?? "en"} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
                {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </Card>
            {firstRun && (
              <label className="flex min-h-12 items-center gap-3 px-1 font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                i&apos;m 18 or older
              </label>
            )}
          </>
        )}
      </div>
      <div className="px-4 pt-4 pb-6">
        <Button size="lg" onClick={save} disabled={busy || !me || !name.trim() || !adult}>{busy ? "saving…" : firstRun ? "let's go" : "save"}</Button>
      </div>
    </AppShell>
  );
}
