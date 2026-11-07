"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Notice } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { ShareLink } from "./share-link";

// For someone you've just met in person: no nearby search, just a link.
export function InviteCard() {
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      setLink((await api.createInvite()).url);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 403 ? e.message : "Couldn't make a link just now. Try again?");
    } finally {
      setBusy(false);
    }
  }

  if (!link) {
    return (
      <div className="px-4 pt-2 pb-4">
        {error && <div className="mb-2"><Notice tone="warning">{error}</Notice></div>}
        <Button variant="quiet" className="w-full" onClick={create} disabled={busy}>
          {busy ? "Making a link…" : "Just met someone? Send them a quest"}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-4">
      <section className="space-y-4 rounded-[24px] bg-surface p-5 shadow-card">
        <div>
          <p className="text-[17px] font-semibold">Send this to them</p>
          <p className="mt-1 text-[14px] leading-snug text-ink-muted">When they say yes, you&apos;ll both get the same quest. The link lasts 30 minutes.</p>
        </div>
        <ShareLink url={link} title="Do a 20-minute quest with me" />
        <ButtonLink className="w-full" variant="secondary" href="/match">Wait for them</ButtonLink>
      </section>
    </div>
  );
}
