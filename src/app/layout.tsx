import type { Metadata, Viewport } from "next";
import { Fraunces, Funnel_Display, Funnel_Sans, Gaegu } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

const display = Funnel_Display({ subsets: ["latin"], variable: "--font-funnel-display", display: "swap" });
const sans = Funnel_Sans({ subsets: ["latin"], variable: "--font-funnel-sans", display: "swap" });
// Handwriting, only for short status lines and section labels.
// A soft old-style serif, only for the big numbers under the sun (Home, You, Crew, proof coins).
const numeral = Fraunces({ subsets: ["latin"], axes: ["SOFT", "opsz"], variable: "--font-fraunces", display: "swap" });
const hand = Gaegu({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-gaegu", display: "swap" });

export const metadata: Metadata = {
  // Each page names itself ("Crew · Amble"), so a screen reader announces where you've landed.
  title: { template: `%s · ${APP_NAME}`, default: APP_NAME },
  description: APP_TAGLINE,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable} ${numeral.variable} h-full`}>
      <body className="min-h-full">
        {/* Vertical-only blur, used for motion blur on rolling numbers. */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="vblur" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="0 2.2" />
          </filter>
          {/* A pen's wobble for the hand-drawn icons in components/ui/ink.tsx. */}
          <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
