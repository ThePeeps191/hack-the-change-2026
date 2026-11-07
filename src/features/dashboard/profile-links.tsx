import Link from "next/link";

export function ProfileLinks() {
  return (
    <nav aria-label="Your data" className="flex justify-center gap-6 pb-2 text-[14px] font-medium text-ink-faint">
      <Link href="/welcome" className="flex min-h-11 items-center hover:text-ink-muted">Name and language</Link>
      <Link href="/privacy" className="flex min-h-11 items-center hover:text-ink-muted">Your data</Link>
    </nav>
  );
}
