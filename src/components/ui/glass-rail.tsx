"use client";
import { Glass } from "@samasante/liquid-glass";
import { useReducedMotion, useSpring, useTransform, useVelocity, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { useGoFree } from "@/features/matching/use-go-free";
import { api } from "@/lib/api";
import { APP_NAME } from "@/lib/config";
import type { User } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { Hand, side } from "./app-shell";
import { Avatar } from "./avatar";
import { CompassButton } from "./compass-button";

// The computer's sidebar: a pane of glass over a little piece of sky. It lives
// in the root layout, not in each page, so it stays put while pages change (a
// page's entrance animation uses a CSS filter, and a filter on a parent would
// switch the glass off for that moment). globals.css shows it only when the
// page's AppShell has the nav and the screen is 1024px or wider.

const groups = [
  [side[0], side[1]],
  [side[3], { href: "/claim", label: "Claim", icon: "M5.5 21V3.5M5.5 4h12l-2.5 4.5 2.5 4.5h-12" }],
];

// Glass that stays out of the way: a thin bent rim and light frost, no dome and
// almost no colour split, so the words on it are what you read.
const paneOptics = { strength: 0.012, depth: 0.1, curvature: 0, bend: 0.7, bendWidth: 0.018, dispersion: 0.12, frost: 7, sheen: 0.32, glow: 0.04 };
// The lens that slides between rows bends a little more, so you see it move.
const lensOptics = { strength: 0.06, depth: 0.3, curvature: 0.12, bend: 0.8, bendWidth: 0.16, dispersion: 0.22, frost: 1, sheen: 0.5, glow: 0.08, specular: 0.6 };

const line = <div aria-hidden className="-mx-2 my-2.5 h-px bg-gradient-to-r from-white/10 via-white/50 to-white/10" />;
const row = "rail-link relative flex h-[var(--rail-row)] items-center gap-3 rounded-[16px] px-3 text-[16px] text-on-sky";

// The light on the glass and the band of sky behind it lean toward the pointer.
// Set straight on the element, since this runs many times a second.
function usePointerLight(rail: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = rail.current;
        if (!el) return;
        el.style.setProperty("--light-x", `${e.clientX - 12}px`);
        el.style.setProperty("--light-y", `${e.clientY - 12}px`);
        el.style.setProperty("--lean", (e.clientX / innerWidth).toFixed(3));
      });
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", move);
    };
  }, [rail]);
}

// The compass and its words. The rail never unmounts, so this part is keyed by
// page: arriving somewhere new clears "busy" from the last tap.
function GoFree() {
  const { go, busy, error } = useGoFree();
  return (
    <div className="flex items-center gap-2.5 px-1.5">
      <CompassButton onClick={go} disabled={busy} label="I'm free: find someone nearby" size={52} />
      {error ? (
        <span role="status" className="min-w-0 text-[13px] leading-snug text-on-sky/90">{error}</span>
      ) : (
        // The words are a bigger target for the mouse. The compass is the real
        // control for keyboards and screen readers, so this one is hidden from them.
        <button type="button" tabIndex={-1} aria-hidden onClick={() => go()} disabled={busy} className="min-w-0 cursor-pointer text-left text-[13px] leading-snug text-on-sky/90">
          <span className="block text-[15px] font-semibold text-on-sky">I&apos;m free</span>
          find someone nearby
        </button>
      )}
    </div>
  );
}

export function GlassRail() {
  const path = usePathname();
  const rail = useRef<HTMLElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [canSignOut, setCanSignOut] = useState(false);
  const [aimed, setAimed] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const reduce = useReducedMotion();
  usePointerLight(rail);

  const wide = () => matchMedia("(min-width: 1024px)").matches;

  // Who's signed in, asked again on each page so a new name or character shows.
  // Phones never see the rail, so they skip the request.
  useEffect(() => {
    if (wide()) api.me().then(setUser).catch(() => setUser(null));
  }, [path]);

  // With mock login there's nothing to sign out of (same check as the You page).
  useEffect(() => {
    if (wide()) fetch("/api/health").then((r) => r.json()).then((h) => setCanSignOut(h.auth_mode === "live")).catch(() => {});
  }, []);

  // The lens sits on the row you're pointing at, or else the page you're on.
  // A spring moves it, and its speed stretches it a little, like a drop.
  const target = aimed ?? path;
  const y = useSpring(0, { stiffness: 380, damping: 30, mass: 0.9 });
  const speed = useVelocity(y);
  const scaleY = useTransform(speed, [-1800, 0, 1800], [1.16, 1, 1.16]);
  const scaleX = useTransform(speed, [-1800, 0, 1800], [0.96, 1, 0.96]);

  useEffect(() => {
    const box = rows.current;
    if (!box) return;
    const place = () => {
      const el = box.querySelector<HTMLElement>(`[data-row="${target}"]`);
      if (!el || !rail.current || !el.offsetHeight) return;
      const top = el.getBoundingClientRect().top - rail.current.getBoundingClientRect().top;
      if (reduce || !placed) y.jump(top);
      else y.set(top);
      setPlaced(true);
    };
    place();
    // Fonts arriving or the window changing height moves the rows.
    const seen = new ResizeObserver(place);
    seen.observe(box);
    return () => seen.disconnect();
  }, [target, reduce, placed, y]);

  const aim = (e: SyntheticEvent) => setAimed((e.target as Element).closest<HTMLElement>("[data-row]")?.dataset.row ?? null);
  const name = user?.display_name || "You";

  return (
    <nav ref={rail} aria-label="main" className="glass-rail grain fixed inset-y-0 left-0 z-0 w-[264px]">
      <div aria-hidden className="rail-sky">
        <div className="rail-band" />
        
        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 300 240" fill="none" aria-hidden>
          <path d="M0 96C42 62 70 74 104 92c34 18 58 6 92-26 34-32 68-22 104 14v160H0z" fill="var(--rail-ridge-far)" />
          <path d="M0 150c36-26 76-30 118-6 34 19 72 20 108-2 28-17 52-16 74-2v100H0z" fill="var(--rail-ridge-mid)" />
          <path d="M0 196c48-20 92-20 140-4 50 17 104 14 160-6v54H0z" fill="var(--rail-ridge-near)" />
        </svg>
      </div>

      {/* Glass only turns on its material look when it has a child, so these get an empty one. */}
      <Glass className="rail-pane absolute inset-3 rounded-[24px]" optics={paneOptics}><span /></Glass>
      <div aria-hidden className="rail-light absolute inset-3 rounded-[24px]" />

      {/* A sibling of the pane, not a child: glass can only bend what's behind
          it inside the same parent, and this one bends the pane and the sky. */}
      <motion.div aria-hidden className={`absolute inset-x-5 top-0 h-[var(--rail-row)] ${placed ? "" : "invisible"}`} style={{ y, scaleX, scaleY }}>
        <Glass className="rail-lens absolute inset-0 rounded-[16px]" optics={lensOptics}><span /></Glass>
      </motion.div>

      <div className="absolute inset-3 flex flex-col px-2 pt-5 pb-4">
        <Hand className="px-3 text-[38px] leading-none font-bold text-on-sky">{APP_NAME.toLowerCase()}</Hand>
        <div ref={rows} onPointerOver={aim} onPointerLeave={() => setAimed(null)} onFocus={aim} onBlur={() => setAimed(null)} className="mt-3 flex flex-1 flex-col">
          {line}
          <Link href="/me" data-row="/me" aria-current={path === "/me" ? "page" : undefined} aria-label={`You, ${name}`} onClick={() => tick(0.6)} className={row}>
            {user ? <Avatar name={user.display_name} avatar={user.avatar} size={34} /> : <span className="size-[34px] shrink-0 rounded-full bg-white/15" />}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate font-semibold">{name}</span>
              <span className="block text-[13px]">your profile</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 opacity-70">
              <path d="M9.5 5.5L16 12l-6.5 6.5" />
            </svg>
          </Link>
          {line}
          <Hand className="px-3 pb-1 text-[17px] leading-none text-on-sky/85">menu</Hand>
          {groups.map((group, g) => (
            <div key={g}>
              {g > 0 && line}
              <ul className="flex flex-col">
                {group.map((t) => {
                  const active = path === t.href;
                  return (
                    <li key={t.href}>
                      <Link href={t.href} data-row={t.href} aria-current={active ? "page" : undefined} onClick={() => tick(0.6)} className={`${row} ${active ? "font-bold" : "font-medium"}`}>
                        <svg className="rail-icon" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d={t.icon} />
                        </svg>
                        {t.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="mt-auto">{line}</div>
          <GoFree key={path} />
          {canSignOut && (
            <>
              {line}
              {/* A plain link, not next/link: a prefetch would sign you out. */}
              <a href="/api/signout" data-row="/api/signout" className={`${row} font-medium`}>
                <svg className="rail-icon" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3.5v8M7.2 6.4a8 8 0 1 0 9.6 0" />
                </svg>
                Sign out
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
