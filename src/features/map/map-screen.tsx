"use client";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Quest } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import type { GlobeMarker } from "@/components/map/globe-map";
import { QuestCard } from "@/features/quests/quest-card";
import { QuestSheet } from "@/features/quests/quest-sheet";

const GlobeMap = dynamic(() => import("@/components/map/globe-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse" style={{ background: "linear-gradient(180deg, var(--color-sky-top), var(--color-sky-bottom))" }} />,
});

type Filter = "all" | "local" | "event";
const markColor = { local: "var(--color-local)", event: "var(--color-event)", anywhere: "var(--color-anywhere)" } as const;
const soft = { type: "spring", stiffness: 260, damping: 32 } as const;

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const frosted = "grid size-11 place-items-center rounded-full bg-surface/85 text-ink shadow-card backdrop-blur-md transition-transform active:scale-95";

export function MapScreen() {
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<Quest | null>(null);

  useEffect(() => {
    api.quests().then(setQuests).catch(() => setQuests([]));
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const shown = (quests ?? [])
    .filter((q) => (filter === "all" ? true : q.type === filter))
    .sort((a, b) => Number(b.lat != null) - Number(a.lat != null));
  const placed = shown.filter((q) => q.lat != null && q.lng != null);
  const markers = useMemo<GlobeMarker[]>(
    () => placed.map((q) => ({ id: q.id, lat: q.lat!, lng: q.lng!, color: markColor[q.type], label: q.place_name ?? q.title })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the visible set changes
    [quests, filter],
  );
  const picked = shown.find((q) => q.id === selected) ?? null;
  const ordered = picked ? [picked, ...shown.filter((q) => q.id !== picked.id)] : shown;

  function choose(id: string) {
    const q = (quests ?? []).find((x) => x.id === id);
    setSelected(id);
    if (q?.lat != null && q.lng != null) setFocus({ lat: q.lat, lng: q.lng });
  }

  function toggle() {
    tick(0.8);
    setExpanded((e) => !e);
  }

  const behind = {
    animate: expanded ? { scale: 0.94, opacity: 0.5, filter: "blur(10px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    style: { transformOrigin: "50% 0%" },
  };

  return (
    <AppShell>
      <motion.header {...behind} className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3">
        <Hand as="h1" className="text-[36px] leading-none font-bold">around you</Hand>
        <p className="mt-1 text-[14px] text-ink-muted">Drag to spin the globe. Tap a dot to see what&apos;s there.</p>
      </motion.header>

      {/* The map keeps its slot in the page so nothing jumps when it opens up. */}
      <div className="relative mx-4 h-[50dvh] min-h-[320px]">
        <AnimatePresence>
          {expanded && (
            <motion.button
              aria-label="Close the map"
              className="fixed inset-0 z-40 bg-[var(--scrim)] backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={toggle}
            />
          )}
        </AnimatePresence>
        <motion.div
          layout
          transition={soft}
          className={
            expanded
              ? "fixed inset-x-2.5 top-[max(10px,env(safe-area-inset-top))] bottom-[max(10px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[620px] overflow-hidden rounded-[32px] shadow-lift"
              : "absolute inset-0 overflow-hidden rounded-[28px] shadow-card"
          }
          style={{ borderRadius: expanded ? 32 : 28 }}
        >
          <GlobeMap markers={markers} selected={selected} onSelect={choose} focus={focus} />

          <motion.div layout="position" className="absolute top-3 right-3 flex flex-col gap-2">
            <button onClick={toggle} aria-label={expanded ? "Shrink the map" : "Expand the map"} className={frosted}>
              <Icon d={expanded ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
            </button>
          </motion.div>

          <AnimatePresence>
            {expanded && picked && (
              <motion.div
                key={picked.id}
                className="absolute inset-x-3 bottom-3"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <QuestCard quest={picked} onClick={() => setOpen(picked)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.section {...behind} className="px-4 pt-4" aria-label="Quests on the map">
        <Segmented<Filter>
          label="Show"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setSelected(null);
          }}
          options={[
            { value: "all", label: "Everything" },
            { value: "local", label: "Nearby" },
            { value: "event", label: "Events" },
          ]}
        />
        <div className="mt-3 flex flex-col gap-2.5">
          {quests === null
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[104px] rounded-[20px]" />)
            : ordered.length === 0
              ? <p className="px-1 py-3 text-[15px] text-ink-muted">Nothing of this kind nearby right now.</p>
              : ordered.map((q) => (
                  <motion.button
                    layout
                    transition={soft}
                    key={q.id}
                    onClick={() => (q.id === selected || q.lat == null ? setOpen(q) : choose(q.id))}
                    className={`block w-full rounded-[20px] text-left outline-offset-2 ${q.id === selected ? "outline-2 outline-accent" : ""}`}
                    aria-pressed={q.id === selected}
                  >
                    <QuestCard quest={q} />
                  </motion.button>
                ))}
        </div>
      </motion.section>
      <QuestSheet quest={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
