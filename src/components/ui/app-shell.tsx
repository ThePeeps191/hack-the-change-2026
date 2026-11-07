"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const tabs = [
  { href: "/", label: "today", icon: "M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" },
  { href: "/map", label: "map", icon: "M9 4l6 2 5-2v14l-5 2-6-2-5 2V6zM9 4v14M15 6v14" },
  { href: "/crew", label: "crew", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19c0-3 2.5-5 5-5s5 2 5 5M13 15c1-.7 2-1 3-1 2.5 0 5 2 5 5" },
  { href: "/me", label: "you", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.5-6 8-6s8 2 8 6" },
];

// Phone-first column. On wider screens it stays a centred column so nothing
// stretches, and the tab bar sits at the bottom of that column.
export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas md:border-x md:border-line">
      <div className="flex flex-1 flex-col">{children}</div>
      {nav && (
        <nav
          aria-label="main"
          className="sticky bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
        >
          <ul className="grid grid-cols-4">
            {tabs.map((t) => {
              const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold ${active ? "text-accent" : "text-ink-faint hover:text-ink-muted"}`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={t.icon} />
                    </svg>
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function TopBar({ title, back, right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="flex min-h-14 items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
      {back && (
        <Link href={back} aria-label="back" className="-ml-2 grid size-11 place-items-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      )}
      <div className="flex-1 text-[17px] font-bold">{title}</div>
      {right}
    </header>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  const tones = { neutral: "bg-sunken text-ink-muted", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger" };
  return <p className={`rounded-control px-4 py-3 text-sm ${tones[tone]}`} role="status">{children}</p>;
}
