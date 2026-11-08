# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Any adult (18+) with a phone and some free time, anywhere. It isn't aimed at a niche: no particular age band, campus or fitness level. The typical moment: someone has about 20 free minutes, is standing somewhere ordinary (between errands, after class, on a lunch break), and would rather spend them outside with a person than on their phone. A second group is friends who play longer games together as a crew, sometimes from different cities.

Hackathon judges are a secondary audience for the demo, which runs on the UCalgary campus. They arrive by link or QR code, have never seen the app, and may be alone.

## Product Purpose

Amble gets people outside together, in two ways:

- **System 1, 20-minute quests with someone new:** say you're free, get matched with someone nearby who is also free (both accept first), do one short shared task, submit proof, and the AI (Claude) checks it. It ends cleanly, and you can add each other as friends if you both want.
- **System 2, crews:** friend groups play longer games: shared quests, races, "anywhere" fitness quests for friends in different cities, coins, a crew leaderboard, and Claim mode, where teams take map zones by completing that zone's challenge and rivals steal them by beating the result.

Success means more minutes outside, more steps and more new people met, without the app feeling like a chore or a scoreboard.

Prompt: Hack the Change 2026, health, social connection and well-being. The context is loneliness (23% of Canadians aged 15 to 24 are always or often lonely) and inactivity (46% of Canadian adults get the recommended 150 minutes a week).

## Positioning

Quests are hand-made by us, so every one is safe and worth doing. The AI (Claude Haiku) is the referee and producer: it checks photo and video proof against the quest, place and time, and writes the recap. City-game apps like Zone Tag and We Clue need a human to approve photos. Amble doesn't.

## Operating Context

- Phone held in one hand, outdoors, often walking, sometimes in bright sun, sometimes at dusk or after dark (Calgary sunset is around 17:00 in November).
- Opened from a shared link or QR code and added to the home screen. There's no app store.
- Patchy signal outdoors, GPS sometimes denied, the AI sometimes slow.
- Strangers meet at the quest location, never at each other's location.

## Capabilities and Constraints

- Quest types: `local` (a place nearby), `anywhere` (fitness, works in any city), `event` (something on today).
- Proof types: photo, video, GPS route.
- Shared quest shape and API: `docs/CONTRACTS.md` and `src/lib/contracts.ts`.
- Stack: Next.js 16, TypeScript, Tailwind 4, bun. Auth0, Tiger Data (Postgres), Claude Haiku for the AI, hosted on Vercel at amble.health. A Gemini path exists in the code but isn't used.
- Safety: 18+, quests stay public, daylight and walking pace, report button, meet at the quest spot.
- The UI is built against mocks (`AUTH_MODE=mock`, `AI_MODE=mock`) behind `src/lib/api.ts`.
- **Undecided:** the ratings model (proposed separately), personas, and hide and seek (a stretch goal).

## Brand Commitments

- Name: **Amble**, kept in one constant (`APP_NAME` in `src/lib/config.ts`).
- One mascot, a single host character shared by everyone. It's the app's voice and carries emotion through every state, and it doubles as the logo. Original SVG art with several poses.
- Voice: warm, low-pressure, lowercase-friendly and specific. It never yells, guilts or counts down at you.
- Light theme plus a dark theme that follows the system setting.
- The user named these references: nudgy.run (mascot moods, sky motif, lowercase copy, the product shown through real cards), burrow (a little world, a creature that reacts, tiny status labels), GitHub/Primer (spacing scale, hierarchy, calm density, complete states) and tasteskill.dev (restraint: no purple gradients, glass cards, emoji icons or gradient text, and specific copy).

## Evidence on Hand

- UCalgary starter quests in `data/quests/`. Coordinates are approximate.
- No real users, testimonials or usage numbers exist. Fixtures use made-up names (Sam, Priya, Theo, Mina, Jo) and must stay obviously synthetic.

## Product Principles

1. **Twenty minutes, then done.** Every System 1 screen moves you toward the outdoors and to a clean ending. Nothing traps you in the app.
2. **Safe before clever.** Mutual accept, public places, meeting at the spot, and an easy report button are visible and never buried.
3. **Calm over competitive.** Stranger quests are cooperative and feed well-being stats. Head-to-head ratings live only where play really is competitive (crew vs crew).
4. **Show, don't announce.** Real quest cards, real places, real states. The mascot reacts instead of explaining.
5. **Works when things fail.** GPS denied, no signal or a slow AI each gets a usable, friendly state.

## Accessibility & Inclusion

- WCAG AA contrast at minimum, with text and controls that stay legible in direct sunlight.
- Tap targets of at least 44 px, everything reachable one-handed, and primary actions in the thumb zone.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- No fitness-level assumptions: quests are walking pace, and "anywhere" fitness quests always have an easier option.
