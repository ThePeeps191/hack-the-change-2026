import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

// Placeholder index while the real screens are built. Each link is a route
// that exists, so every area can find its page.
const screens = [
  ["/", "home: free for 20 min?"],
  ["/match", "matching"],
  ["/quest/demo", "active quest"],
  ["/quest/demo/proof", "proof"],
  ["/recap/demo", "recap"],
  ["/map", "map"],
  ["/crew", "crew and leaderboard"],
  ["/claim", "claim mode"],
  ["/me", "dashboard"],
  ["/api/me", "api: /api/me (mock)"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{APP_NAME}</h1>
      <p className="mt-2 text-ink-muted">{APP_TAGLINE}</p>
      <ul className="mt-8 divide-y divide-line rounded-card bg-surface shadow-card">
        {screens.map(([href, label]) => (
          <li key={href + label}>
            <Link href={href} className="flex min-h-12 items-center px-5 py-3 hover:bg-sunken">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
