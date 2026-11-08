"use client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { tick } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const noop = () => () => {};

// Shows the crew's invite code big enough to read out loud or type in, plus the
// join link, with one button to share or copy it.
export function InviteSheet({ open, onClose, name, code }: { open: boolean; onClose: () => void; name: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const link = mounted ? `${location.origin}/join/${code}` : `/join/${code}`;

  async function share() {
    tick(0.8);
    try {
      if (navigator.share) await navigator.share({ title: `Join ${name}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  }

  if (!mounted) return null;
  return createPortal(
    <Sheet open={open} onClose={onClose} label="Invite to your crew">
      <div className="px-5 pt-1 pb-2 text-center">
        <p className="text-[19px] font-semibold">Invite friends to {name}</p>
        <p className="mt-1 text-[14px] leading-snug text-ink-muted">They can enter this code, or open the link.</p>
        <p className="mt-5 rounded-[20px] bg-sunken px-4 py-5 font-mono text-[34px] font-semibold tracking-[0.12em] select-all" aria-label={`Invite code ${code.split("").join(" ")}`}>
          {code}
        </p>
        <p className="mt-3 text-[13px] break-all text-ink-faint select-all">{link}</p>
        <Button className="mt-5 w-full" onClick={share}>{copied ? "Link copied" : "Share link"}</Button>
        <Button variant="quiet" className="mt-1 w-full" onClick={onClose}>Done</Button>
      </div>
    </Sheet>,
    document.body,
  );
}
