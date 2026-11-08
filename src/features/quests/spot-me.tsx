"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { RunMember } from "@/lib/contracts";

// Two strangers at a busy building need a way to find each other without
// sharing anything more than a first name: one short line each, like "red
// jacket, by the main doors". Yours is shown to your partner, theirs to you.
export function SpotMe({ runId, you, partner }: { runId: string; you: RunMember; partner: RunMember }) {
  const [draft, setDraft] = useState(you.hint ?? "");
  const [editing, setEditing] = useState(!you.hint);
  const [saved, setSaved] = useState(you.hint ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await api.setHint(runId, draft);
      setSaved(draft.trim());
      setEditing(!draft.trim());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-card" aria-label="Finding each other">
      <p className="text-[13px] font-medium text-ink-muted">How to spot {partner.display_name}</p>
      <p className="mt-0.5 text-[16px] font-medium text-ink">
        {partner.hint ?? <span className="text-ink-faint">Nothing yet. You&apos;ll see it here when they add one.</span>}
      </p>

      <div className="mt-3 border-t border-[var(--hairline)] pt-3">
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-2">
            <label htmlFor="spot-me" className="text-[13px] font-medium text-ink-muted">How they can spot you</label>
            <div className="flex gap-2">
              <input
                id="spot-me"
                value={draft}
                maxLength={80}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. red jacket, by the main doors"
                className="min-h-11 min-w-0 flex-1 rounded-[14px] bg-sunken px-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent"
              />
              <button type="submit" disabled={busy} className="min-h-11 rounded-[14px] bg-accent px-4 text-[15px] font-semibold text-on-accent disabled:opacity-60">
                {busy ? "…" : "Share"}
              </button>
            </div>
            {error && <p className="text-[13px] text-danger">That didn&apos;t send. Try again?</p>}
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-[14px] text-ink-muted">
              They see: <span className="font-medium text-ink">{saved}</span>
            </p>
            <button onClick={() => setEditing(true)} className="min-h-11 px-1 text-[14px] font-semibold text-accent">Change</button>
          </div>
        )}
      </div>
    </section>
  );
}
