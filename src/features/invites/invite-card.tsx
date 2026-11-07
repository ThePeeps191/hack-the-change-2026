"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Notice } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      setError(e instanceof ApiError && e.status === 403 ? e.message : "couldn't make a link just now. try again?");
    } finally {
      setBusy(false);
    }
  }

  if (!link) {
    return (
      <div className="px-4 pt-3">
        {error && <div className="mb-2"><Notice tone="warning">{error}</Notice></div>}
        <Button variant="quiet" className="w-full" onClick={create} disabled={busy}>
          {busy ? "making a link…" : "invite someone you've met"}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <Card className="space-y-3 p-4">
        <div>
          <p className="font-semibold">send this to them</p>
          <p className="mt-1 text-sm text-ink-muted">when they say yes, you&apos;ll both get the same quest. the link lasts 30 minutes.</p>
        </div>
        <ShareLink url={link} title="do a 20-minute quest with me" />
        <ButtonLink className="w-full" variant="secondary" href="/match">wait for them</ButtonLink>
      </Card>
    </div>
  );
}
