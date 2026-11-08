# Amble: technical summary

A short tour of how Amble is built. For the full walk through the code, see [WALKTHROUGH.md](WALKTHROUGH.md). For the exact types, tables and API, see [CONTRACTS.md](CONTRACTS.md). For what's live and how it's wired, see [DEPLOYMENT.md](DEPLOYMENT.md).

## What it is

A mobile-first website at **https://amble.health**, installable on a phone's home screen. It has two halves:

- **Meet someone new.** Tap "I'm free", get paired with someone nearby who's free too, and do a 20-minute quest together at a public place. An AI checks your photo proof, then writes a short recap.
- **Crews and Claim.** Friends form a crew, earn coins from quests, and play Claim, a game of taking and stealing spots on the campus map.

## Stack

| Layer | What we use |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion, run with bun |
| Database | Postgres on **Tiger Data** (with TimescaleDB) in production; embedded Postgres (**PGlite**) on laptops |
| Sign-in | **Auth0**, plus a signed "Try the demo" login for judges |
| AI | **Claude Haiku 5.5** through the Anthropic SDK |
| Maps | MapLibre GL with free OpenFreeMap tiles (no key) |
| Hosting | **Vercel**; the domain is a GoDaddy Registry `.health` name |

## How the code is layered

```
phone  ->  src/features/*     screens, one folder per feature
           src/lib/api.ts     typed client: screens never call fetch directly
           src/app/api/**     thin routes: sign the user in, parse, call src/server
           src/server/*       every rule: matching, runs, proof, coins, crews, Claim
           src/lib/db.ts      one query() over Postgres
           src/lib/ai.ts      every AI call, with a mock for development
```

Phones only talk to our own API, so no secret key ever reaches a browser.

## Five design decisions

1. **No background workers.** Phones poll every 3 seconds, and each poll moves the state forward: a match expires, a quest ends, the practice partner answers. Nothing runs on a timer, so there's nothing extra to deploy or break.
2. **The server decides.** Pairing two people, creating a run and paying coins happen in database transactions on the server. Two taps at the same moment can't create two runs, and a unique index makes paying coins twice impossible.
3. **The AI never blocks anyone.** Proof is saved and answered "pending" straight away, then judged after the response (Next's `after()`). Every AI call has a timeout and a fallback: if the AI is down, the proof counts and the recap is a plain summary.
4. **One SQL path, two engines.** The same SQL runs on Tiger Data in production and on PGlite locally. Each developer worktree gets its own database in `.data/`, which migrates and seeds itself, so nobody needs an account to run the app.
5. **Quests are hand-made.** We wrote every quest ourselves (`data/quests/quests.json`, 17 of them). The AI judges and narrates; it never invents where people go.

## Data

- **Tables** (in `db/migrations/`, which only ever add things): people (`users`, `connections`, `reports`), meeting (`availability`, `matches`), quests (`quests`, `quest_runs`, `run_members`, `submissions`, `recaps`, `checkins`), crews (`crews`, `crew_members`, `coin_events`), and Claim (`games`, `game_teams`, `zones`, `zone_attempts`).
- **TimescaleDB on Tiger Data:** `location_pings` is a hypertable with a 30-day retention policy, so walking routes delete themselves. The You tab's week is built with `time_bucket`.
- **Proof photos and videos** are stored in Postgres and only served to the people on that quest.
- **Content files:** the starter quests and the five Claim spots (`data/claim-quests.json`) are copied into the database on every deploy. Two local tools edit them on a map: `bun tools/quest-maker-server.ts`, then `/` for quests or `/claim` for Claim.

## The AI

- **Checking proof:** Claude Haiku looks at the photo (resized to 1568 px) or at three still frames the phone pulls from a video. It answers approved or rejected, with a one-line reason for the player. It's told to be generous with honest attempts.
- **Writing the recap:** two sentences about the walk, from what happened and what the photo shows, written once and kept.
- **Modes:** `AI_MODE=mock` (the default locally) fakes a verdict in two seconds and costs nothing. The site runs `AI_MODE=live` with `AI_PROVIDER=claude`. A Gemini path exists in the code but isn't used.

## Privacy and safety in the code

- Your location is deleted the moment you're matched. Your partner only ever sees a rough distance, never where you are.
- Your partner's name stays hidden until you both accept.
- Reporting someone ends the quest, and you're never paired with them again.
- For real accounts, meeting someone new needs a verified email, happens in daylight, and proof must be taken near the spot during the quest. The judging site runs `DEMO_MODE=1`, which turns these off so judges can try it from a desk.
- You can download or delete everything about you from the privacy page.

## Claim in brief

Each spot on the board is a zone with a challenge and a best score. Finish the challenge with approved proof to take an empty zone; beat the best score to steal a held one. A row lock stops two teams taking a zone at once. Steals are the only wins and losses in the app, so they're the only thing that changes a crew's rating (Glicko-2). Claim challenges pay no coins: the prize is the spot. The rules for players are in [CLAIM.md](CLAIM.md).

## Running, testing, deploying

- **Run locally:** `bun install`, then `PORT=3001 bun run dev`. It needs no keys: login and AI are mocked by default.
- **Test:** `BASE_URL=http://localhost:3001 bun run smoke` drives the whole product over HTTP as a dozen simulated people (96 checks). `bun run check` runs types and lint.
- **Deploy:** only `main` deploys, to Vercel. The build migrates Tiger Data first.

## Where things are

| Path | What's there |
| --- | --- |
| `src/app/` | Pages and API routes |
| `src/features/` | Screens by feature: matching, quests, proof, recap, crews, Claim, the You tab |
| `src/server/` | The rules |
| `src/lib/` | Shared types (`contracts.ts`), the API client, and the database, sign-in and AI layers |
| `data/` | Hand-written quests and Claim spots |
| `db/migrations/` | The schema |
| `scripts/` | Migrations and the smoke test |
| `tools/` | The quest and Claim makers |
