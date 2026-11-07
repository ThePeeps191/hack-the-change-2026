import Link from "next/link";

// Temporary screen body until the real screen lands.
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← all screens
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-ink-muted">{note}</p>
    </main>
  );
}
