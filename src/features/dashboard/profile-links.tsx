"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function ProfileLinks() {
  // With mock login everyone is the same made-up person, so there's nothing to
  // sign out of. Only show it when real (or demo) sign-in is on.
  const [canSignOut, setCanSignOut] = useState(false);
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((h) => setCanSignOut(h.auth_mode === "live")).catch(() => {});
  }, []);

  return (
    <nav aria-label="Your account" className="flex flex-wrap justify-center gap-x-6 pb-2 text-[14px] font-medium text-ink-faint">
      <Link href="/welcome" className="flex min-h-11 items-center hover:text-ink-muted">Name and language</Link>
      <Link href="/privacy" className="flex min-h-11 items-center hover:text-ink-muted">Your data</Link>
      {/* A plain link, not next/link: a prefetch would sign you out. */}
      {canSignOut && <a href="/api/signout" className="flex min-h-11 items-center hover:text-ink-muted">Sign out</a>}
    </nav>
  );
}
