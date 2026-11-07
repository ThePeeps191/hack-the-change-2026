"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { tick } from "@/lib/feedback";
import { useGoFree } from "@/features/matching/use-go-free";
import { OrbButton } from "./orb-button";

const side = [
  { href: "/", label: "Today", icon: "M12 3.5l8 6.2V20a.5.5 0 0 1-.5.5h-5v-6h-5v6h-5A.5.5 0 0 1 4 20V9.7z" },
  { href: "/map", label: "Map", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 12h17M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" },
  null, // centre: the main action
  { href: "/crew", label: "Crew", icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2" },
  { href: "/me", label: "You", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6" },
] as const;

// Phone-first column, centred on wide screens. The bottom is a quiet row of
// five icons: four places, and the main action in the middle.
export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const path = usePathname();
  const { go, busy } = useGoFree();
  return (
    <div className="grain isolate mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas">
      <div className={`flex flex-1 flex-col ${nav ? "pb-24" : ""}`}>{children}</div>
      {nav && (
        <nav
          aria-label="main"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-canvas from-55% to-transparent pt-6 pb-[max(10px,env(safe-area-inset-bottom))]"
        >
          <ul className="flex items-center justify-around px-4">
            {side.map((t, i) => {
              if (!t) {
                return (
                  <li key="go">
                    <OrbButton onClick={go} disabled={busy} label="I'm free: find someone nearby">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="8.5" cy="12" r="3.2" />
                        <circle cx="15.5" cy="12" r="3.2" />
                      </svg>
                    </OrbButton>
                  </li>
                );
              }
              const active = t.href === "/" ? path === "/" : path.startsWith(t.href) || (t.href === "/crew" && path.startsWith("/claim"));
              return (
                <li key={i}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => !active && tick(0.6)}
                    className={`relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-[14px] transition-colors ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
                  >
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={t.icon} />
                    </svg>
                    <span className={`text-[11px] leading-none ${active ? "font-bold" : "font-medium"}`}>{t.label}</span>
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
    <header className="flex min-h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)]">
      {back ? (
        <Link href={back} aria-label="Back" className="grid size-11 place-items-center rounded-full text-ink hover:bg-sunken">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14.5 5.5L8 12l6.5 6.5" />
          </svg>
        </Link>
      ) : (
        <span className="w-11" />
      )}
      <div className="flex-1 text-center text-[15px] font-semibold">{title}</div>
      <div className="flex min-w-11 justify-end">{right}</div>
    </header>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  const dots = { neutral: "bg-ink-faint", warning: "bg-warning", danger: "bg-danger" };
  return (
    <p className="flex items-start gap-2.5 px-5 py-2 text-[14px] leading-snug text-ink-muted" role="status">
      <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dots[tone]}`} />
      {children}
    </p>
  );
}

// A small handwritten label, for section names and short status lines.
export function Hand({ children, className = "", as: As = "p" }: { children: ReactNode; className?: string; as?: "p" | "h1" | "h2" | "span" }) {
  return <As className={`font-[family-name:var(--font-hand)] ${className}`}>{children}</As>;
}
