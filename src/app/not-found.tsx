"use client";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { buttonClass } from "@/components/ui/button";
import { Hero, Stars } from "@/components/ui/hero";
import Link from "next/link";

// Any URL we don't have, in the app's own look instead of Next's default page:
// the sky, a short dotted path that trails off, and the way back.
export default function NotFound() {
  return (
    <AppShell nav={false}>
      <Hero fill className="min-h-dvh px-6 pt-[max(72px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
        <Stars className="opacity-60" />
        <div className="relative text-center">
          <Hand as="h1" className="text-[56px] leading-none font-bold">wrong turn</Hand>
          <p className="mx-auto mt-3 max-w-[28ch] text-[17px] leading-snug text-balance">There&apos;s nothing at this address. Your quests are all still where you left them.</p>
        </div>
        <svg viewBox="0 0 200 120" className="relative mx-auto mt-10 w-[220px]" aria-hidden>
          <path d="M20 100 C 60 100, 70 60, 110 62 S 160 40, 172 22" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 9" />
          <circle cx="20" cy="100" r="6" fill="#fff" />
          <path d="M166 14l12 12M178 14l-12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="relative mx-auto mt-auto w-full max-w-[400px] pt-8">
          <Link href="/" className={buttonClass("onSky", "lg", "w-full")}>Back to today</Link>
        </div>
      </Hero>
    </AppShell>
  );
}
