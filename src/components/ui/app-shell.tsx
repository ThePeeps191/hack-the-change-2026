"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { tick } from "@/lib/feedback";
import { useGoFree } from "@/features/matching/use-go-free";
import { APP_NAME } from "@/lib/config";
import { CompassButton } from "./compass-button";

const side = [
  { href: "/", label: "Today", icon: "M12 3.5l8 6.2V20a.5.5 0 0 1-.5.5h-5v-6h-5v6h-5A.5.5 0 0 1 4 20V9.7z" },
  { href: "/map", label: "Map", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 12h17M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" },
  null, // centre: the main action
  { href: "/crew", label: "Crew", icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2" },
  { href: "/me", label: "You", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6" },
] as const;

const isActive = (href: string, path: string) =>
  href === "/" ? path === "/" : path.startsWith(href) || (href === "/crew" && path.startsWith("/claim"));

// Phone-first column. The bottom is a quiet row of five icons: four places,
// and the main action in the middle. From 1024px up the four tab pages get the
// width: the bottom row becomes a rail down the left, and each page lays its
// picture and list side by side (see Split). Pages without the nav, like a
// quest or the login, are a single step: `wide` lets one of them use the whole
// screen on a computer, and the page lays itself out (with Split, or a sky
// that fills the screen).
export function AppShell({ children, nav = true, wide = false }: { children: ReactNode; nav?: boolean; wide?: boolean }) {
  const path = usePathname();
  const { go, busy } = useGoFree();
  return (
    <div className={`grain isolate mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas ${nav ? "lg:max-w-none lg:pl-[232px]" : wide ? "lg:max-w-none" : ""}`}>
      <div className={`flex flex-1 flex-col ${nav ? "pb-24 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:pb-0" : ""}`}>{children}</div>
      {nav && (
        <nav aria-label="main" className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[var(--hairline)] bg-canvas px-4 pt-7 pb-6 lg:flex">
          <Hand className="px-3 text-[38px] leading-none font-bold text-ink">{APP_NAME.toLowerCase()}</Hand>
          <ul className="mt-8 flex flex-col gap-1">
            {side.map((t) => t && (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={isActive(t.href, path) ? "page" : undefined}
                  onClick={() => tick(0.6)}
                  className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-[16px] transition-colors hover:bg-sunken ${isActive(t.href, path) ? "font-bold text-ink" : "font-medium text-ink-muted hover:text-ink"}`}
                >
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive(t.href, path) ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* The main action, with its words spelled out since there's room. */}
          <div className="mt-auto flex items-center gap-2.5 px-1">
            <CompassButton onClick={go} disabled={busy} label="I'm free: find someone nearby" size={52} />
            <span className="text-[13px] leading-snug whitespace-nowrap text-ink-muted"><span className="block text-[15px] font-semibold text-ink">I&apos;m free</span>find someone nearby</span>
          </div>
        </nav>
      )}
      {nav && (
        <nav
          aria-label="main"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-canvas from-55% to-transparent pt-6 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
        >
          <ul className="flex items-center justify-around px-4">
            {side.map((t, i) => {
              if (!t) {
                return (
                  <li key="go">
                    <CompassButton onClick={go} disabled={busy} label="I'm free: find someone nearby" />
                  </li>
                );
              }
              const active = isActive(t.href, path);
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

// A short line of status text. No coloured dot: the words carry it, and a
// problem reads a shade stronger than a plain note.
export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <p className={`px-5 py-2 text-[14px] leading-snug ${tone === "neutral" ? "text-ink-muted" : "text-ink"}`} role="status">
      {children}
    </p>
  );
}

// A small handwritten label, for section names and short status lines.
export function Hand({ children, className = "", as: As = "p" }: { children: ReactNode; className?: string; as?: "p" | "h1" | "h2" | "span" }) {
  return <As className={`font-[family-name:var(--font-hand)] ${className}`}>{children}</As>;
}
