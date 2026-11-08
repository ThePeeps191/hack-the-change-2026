"use client";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Prefs, User } from "@/lib/contracts";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { type Comfort, toComfort, toPrefs } from "./prefs";

const LANGUAGES = [
  ["en", "English"], ["fr", "Français"], ["es", "Español"], ["zh", "中文"], ["ar", "العربية"],
  ["hi", "हिन्दी"], ["pa", "ਪੰਜਾਬੀ"], ["tl", "Tagalog"], ["uk", "Українська"], ["ko", "한국어"],
];

const box = "rounded-[24px] bg-surface shadow-card";
const label = "mb-2 px-1 text-[14px] font-medium text-ink-muted";

// First-run setup, and the name and language page afterwards. It uses the same
// controls and words as "how you like to meet" on the You page, so the two
// never disagree, and it starts from what's saved so something is always picked.
export function WelcomeScreen() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const [me, setMe] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [comfort, setComfort] = useState<Comfort>(toComfort({}));
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.me().then((u) => {
      setMe(u);
      setName(u.display_name);
      setComfort(toComfort(u.prefs));
      setLanguage(u.prefs.language ?? "en");
    }).catch(() => setError(true));
  }, []);

  async function save() {
    setBusy(true);
    setError(false);
    try {
      const prefs: Prefs = { ...me?.prefs, ...toPrefs(comfort, language) };
      // age_confirmed_at just marks "finished the welcome screen" now; there is no age question.
      await api.updateMe({ display_name: name, age_confirmed_at: new Date().toISOString(), prefs });
      router.replace(next);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const firstRun = me && !me.age_confirmed_at;
  const update = (patch: Partial<Comfort>) => setComfort((c) => ({ ...c, ...patch }));

  return (
    <AppShell nav={false}>
      <Hero className="pb-8">
        <HeroBar left={firstRun ? undefined : <HeroIcon href="/me" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center={firstRun ? undefined : "you"} />
        <Hand as="h1" className="px-6 pt-2 text-center text-[40px] leading-none font-bold">{firstRun ? "nice to meet you" : "name and language"}</Hand>
        <p className="mx-auto mt-2 max-w-[30ch] px-6 text-center text-[15px] leading-snug text-balance text-on-sky/90">
          {firstRun ? "A few quick things so your quests and partners suit you." : "Change these any time."}
        </p>
      </Hero>

      <motion.div
        className="flex-1 space-y-6 px-4 pt-6"
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {!me && !error && <Skeleton className="h-64 w-full rounded-[24px]" />}
        {error && <Notice tone="warning">Couldn&apos;t save that. Check your signal and try again?</Notice>}
        {me && (
          <>
            <section>
              <label className={`block ${label}`} htmlFor="name">What should people call you?</label>
              <input
                id="name"
                className="min-h-14 w-full rounded-[18px] bg-surface px-4 text-[17px] font-medium text-ink shadow-card ring-1 ring-[var(--hairline)] outline-none focus:ring-2 focus:ring-accent"
                value={name}
                maxLength={40}
                autoComplete="given-name"
                onChange={(e) => setName(e.target.value)}
              />
              <p className="px-1 pt-2 text-[13px] text-ink-muted">A first name is plenty. It&apos;s only shown once you both say yes.</p>
            </section>

            <section>
              <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold">how you like to meet</Hand>
              <div className={`space-y-4 p-4 ${box}`}>
                <div>
                  <p className={label}>Pace</p>
                  <Segmented
                    label="Pace"
                    value={comfort.pace}
                    onChange={(pace) => update({ pace })}
                    options={[
                      { value: "stroll", label: "Easy stroll" },
                      { value: "walk", label: "Walk" },
                      { value: "brisk", label: "Brisk" },
                    ]}
                  />
                </div>
                <div>
                  <p className={label}>Talking</p>
                  <Segmented
                    label="Talking"
                    value={comfort.talk}
                    onChange={(talk) => update({ talk })}
                    options={[
                      { value: "side", label: "Side by side" },
                      { value: "chatty", label: "Happy to chat" },
                    ]}
                  />
                </div>
              </div>
              <div className={`rows mt-2.5 overflow-hidden ${box}`}>
                <Switch checked={comfort.stepFree} onChange={(stepFree) => update({ stepFree })} label="Step-free places only" hint="No stairs or steep paths on the way." />
                <label className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                  <span className="flex-1">
                    <span className="block text-[16px] font-medium">Quests in</span>
                    <span className="block text-[13px] text-ink-muted">The language quests are written in.</span>
                  </span>
                  <select
                    className="min-h-11 rounded-[12px] bg-sunken px-3 text-[15px] font-semibold text-ink outline-none focus:ring-2 focus:ring-accent"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(([code, l]) => <option key={code} value={code}>{l}</option>)}
                  </select>
                </label>
              </div>
            </section>

          </>
        )}
      </motion.div>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-canvas from-70% to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Button size="lg" onClick={save} disabled={busy || !me || !name.trim()}>{busy ? "Saving…" : firstRun ? "Let's go" : "Save"}</Button>
      </div>
    </AppShell>
  );
}
