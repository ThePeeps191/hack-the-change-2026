# Walkthrough: how Amble works, for explaining it out loud

The rules say a team can be disqualified if any member can't explain the code or the design. Every one of us should be able to answer any question in this file without looking. [ARCHITECTURE.md](ARCHITECTURE.md) is the short version for developers. This page is the long version for talking to judges.

If you change how something works, update the section here that describes it.

## The one-minute version

Amble is one website, built with Next.js. On a phone you say "I'm free for 20 minutes". The server finds the nearest other person who's free, gives you both the same short quest at a public place, and an AI checks your photo when you've done it. Then you see a recap. Crews of friends earn coins together and climb a weekly board.

There's one server and one database, and there are no background jobs. The phone asks the server for updates every few seconds, and every rule lives on the server, so the phone can't cheat.

## The layers, from the phone down

Think of a request travelling down through five layers:

```
1. Screen         src/features/<feature>/*.tsx      what you see and tap
2. API client     src/lib/api.ts                    one function per endpoint, so screens never call fetch
3. Route          src/app/api/**/route.ts           about 10 lines: who are you, read the input, call the server
4. Server rules   src/server/*.ts                   every decision: matching, runs, proof, coins
5. Database       src/lib/db.ts                     one query() function, which talks to Postgres
```

On the side are the AI (`src/lib/ai.ts`), login (`src/lib/auth.ts`) and real places (`src/lib/places.ts`).

**How to explain it:** "Screens never know about the database, and routes never contain rules. If you want to change behaviour, you go to `src/server/`. That's why four people and a lot of AI help could work in parallel without breaking each other's code."

**Why Next.js?** The pages and the API live in one project and deploy as one thing, so there's less to connect and less to break during a 24-hour build. It's TypeScript end to end, so the shared types in `src/lib/contracts.ts` are checked on both sides.

## The shared contract

`src/lib/contracts.ts` defines the shapes everyone agreed on at the start: `Quest`, `Match`, `QuestRun`, `Verdict`, `Recap` and so on. `docs/CONTRACTS.md` explains them. Contracts only ever grow: new fields are optional, so nothing breaks. For example, `Match.demo_partner` was added late so the screen could say Priya is a practice partner.

## System 1: meeting someone new, step by step

This is the main demo. Each step names the function that does it.

1. **"I'm free."** The phone asks for GPS (`getPosition` in `src/lib/geo.ts`). If that's denied or slow, it falls back to the middle of campus and says so on screen. It then calls `POST /api/availability`, which runs `setFree` in `src/server/matching.ts`. That stores your location for 20 minutes, after `assertCanMeet` in `src/server/safety.ts` has checked you're 18 or over, verified, and that it's daylight.
2. **The AI starts writing quests now, while you wait** (`warmQuests` in `src/server/quests.ts`). By the time you're matched, a quest is usually ready.
3. **Finding someone.** The match screen asks `GET /api/match` every 3 seconds (`currentMatch`). That calls `tryPair`, which takes a database lock, so two people searching at the same moment can't both grab the same third person. It then finds the nearest free person within 2 km, adds a penalty when comfort settings clash (chatty versus side by side), skips anyone you've reported or just turned down, and creates a match. **Both people's locations are deleted at that moment.**
4. **What you see before saying yes:** a rough distance and nothing else. Your partner's name only appears once you've both said yes (`toMatch`).
5. **Both say yes.** The second "yes" calls `finalize`. In one database transaction it picks a quest that fits both people's settings (`pickPairQuest`, then `chooseForPair`) and creates the run, so two taps at the same moment can't create two runs.
6. **During the quest,** `RunTracker` (`src/features/quests/run-tracker.tsx`) sends your location in batches, and only while a quest is active. That's what the "km walked" in the recap comes from.
7. **Proof.** You take a photo, and `POST /api/runs/:id/submissions` saves it and replies "pending" straight away. The check happens after the reply, through Next's `after()`, so your phone isn't kept waiting. `judgeSubmission` in `src/server/proof.ts` first checks place and time, which is free and can't be argued with: was the photo taken near the spot, during the quest? Then it asks the AI whether the photo shows the quest being done.
8. **Coins.** `applyVerdict` records the result and calls `awardCoins`. A unique index on `coin_events` means a quest can never pay twice, even if the code runs twice.
9. **Finishing.** `settle` in `src/server/runs.ts` marks the run complete once everyone's proof is approved, and works out how far each person walked from their own pings.
10. **Recap.** `getRecap` in `src/server/recaps.ts` asks the AI for a two-line story once and keeps it. It shows your own route, never your partner's. Then you can choose to stay in touch, which only connects you if both say yes (`stayInTouch` in `src/server/people.ts`).

**Alone? Priya.** In demo mode, if nobody real is free after about 4 seconds, you're matched with Priya, a bot (`src/server/bot.ts`). She says yes, sends proof and opts in to stay in touch, so one person can try the whole flow. The screen labels her as a practice partner. Two real people (`/?as=alice` and `/?as=bob` locally) match each other for real.

## No background workers: why, and how things still move

There's no timer or queue running on the server. State moves forward when someone looks at it: expiring old matches, Priya's moves and finishing a run all happen inside `currentMatch` and `advance`, which the phone triggers by polling. The phone polls anyway, so this costs nothing, and it's one less thing to deploy or break on stage. `usePoll` (`src/lib/use-poll.ts`) keeps the last good answer if the signal drops, so the screen never goes blank outdoors.

## The AI: what it does and what stops it going wrong

All AI calls go through three functions in `src/lib/ai.ts`: `generateQuests`, `judgeProof` and `writeRecap`. Behind them:

- **Mock mode** (`AI_MODE=mock`, the default while building) returns starter quests and a fake verdict after 2 seconds. Dozens of sessions can run without spending anyone's credits.
- **Live mode** uses Gemini (`src/lib/gemini-live.ts`) or Claude (`src/lib/ai-claude.ts`), chosen by `AI_PROVIDER`. **The demo runs Gemini.**

**Quests are always at real places.** `placesNear` in `src/lib/places.ts` fetches real, public places near you from OpenStreetMap (libraries, parks, cafés, viewpoints, but no bars and nothing private), plus our own hand-picked campus places. The model picks from that numbered list, and **the coordinates always come from the list, never from the model**, so it can't invent a place. In Gemini mode, Maps and Search grounding add real context and source links, which the quest screen shows.

**A light check on every AI quest.** The prompt (`QUEST_RULES` in `src/lib/quest-safety.ts`) asks for public places, daylight, walking pace and nothing dangerous. Then `toSafeQuest` checks every quest that comes back: a short list of clearly wrong words (alcohol, drugs, weapons, nudity), it must be within 5 km, and it must take 5 to 20 minutes. Anything that fails is dropped. We kept this deliberately small: a longer word list threw away good quests.

**The AI never blocks a person.** Every call has a timeout. If quest writing is slow or fails, you get the starter pack (`data/quests/quests.json`). If the proof check fails, the quest counts anyway and the message says so, because nobody should lose a real walk to our outage. If the recap fails, you get a plain one-line summary.

**Cost.** One call writes several quests for an area, and they're cached for 6 hours within 1 km (`recentlyWritten`), so everyone nearby shares them. Token counts are logged on every call (`logUsage`), without any content, so we can quote a real cost per quest.

**The prompt-injection defence on proof:** the proof prompt tells the model to ignore any writing in the photo that tries to tell it what to answer, and to reject screenshots and photos of screens.

## Login and modes

- `AUTH_MODE=live` uses Auth0. `src/proxy.ts` (Next 16's name for middleware) sends signed-out visitors to `/login`, and `currentUser` in `src/lib/auth.ts` reads the session. We only keep a first name.
- `AUTH_MODE=mock` (local) has no login: you're Sam, or `?as=name` makes that tab someone else.
- `DEMO_MODE=1` adds "Try the demo" on the login page for judges without a student email. It's a signed cookie (HMAC, so it can't be forged), with Priya for everyone, and it switches off the daylight and location rules so judges can try it indoors at 2 PM.
- `ALLOWED_EMAIL_DOMAINS=ucalgary.ca` would restrict meeting strangers to verified student emails, for the campus pilot.

## Data, and the database

`src/lib/db.ts` gives the whole app one `query()` function over two engines:

- **Production:** real Postgres on **Tiger Data**, when `DATABASE_URL` is set. There, `location_pings` is a TimescaleDB **hypertable** with a **30-day retention policy**, so routes delete themselves (`db/migrations/20261107T1501_tiger_hypertable.sql`).
- **Local:** embedded Postgres (PGlite) in `.data/`, one per worktree, which migrates and seeds itself. The same SQL runs on both, and nobody needs an account to run the app.

The schema is in `db/migrations/20261107T1500_foundation.sql`. The main tables are `users`, `availability` (who's free, deleted on match), `matches`, `quests`, `quest_runs` and `run_members`, `submissions` (proof), `location_pings`, `crews`, `games` and `zones` (unused since Claim was cut), `coin_events`, `connections`, `reports` and `checkins` (mood).

## Privacy, in the code

| Promise | Where it's kept |
| --- | --- |
| Location is forgotten once you're matched | `tryPair` deletes both `availability` rows. `expireStale` clears the meeting point of finished matches |
| Your partner never sees where you are | `toMatch` only returns `distance_m` |
| First name only, and only after both say yes | `toMatch`, and `firstName` in `auth.ts` |
| Proof photos only go to people on that quest | `GET /api/media/:id` checks `run_members`, and serves files with a no-script sandbox |
| Your route is shown only to you, and deleted after 30 days | `getRecap`, and the Tiger Data retention policy |
| Download or delete everything | `exportMyData` and `deleteMyData` in `src/server/users.ts`, from `/privacy`. On the shared demo account (Sam, `AUTH_MODE=mock`) it deletes location and photos but keeps the made-up history, so the next judge still sees a full demo |
| Report someone and you're never paired again | `report` in `people.ts`, and the `not exists` check in `tryPair` |
| Keys never reach the browser | All AI and database calls are server-only (`import "server-only"`), and `/api/health` reports where a key came from, never the key itself |

## System 2: crews and coins

- **Crews** (`src/server/crews.ts`): make one, share a code like `MAPLE-42K`, and friends join. Start a quest together and you land on the same run.
- **Coins** come from every finished quest and are paid once (see above). The weekly board (`crewLeaderboard`) only counts the last 7 days, so a quiet week starts everyone level again.

## The wellbeing numbers (the You tab)

`getDashboard` in `src/server/dashboard.ts` computes them from real quests. Everything is private and never ranked.

- **Active minutes this week**, against **150**, the Canadian 24-Hour Movement Guidelines.
- **Familiar faces:** people you've done 2 or more quests with, and your time together, measured against Hall (2019)'s estimate of about 50 hours to become casual friends.
- **New places:** places you visited for the first time, shown as a count on Home.
- **Mood before and after,** from the optional check-in (`checkins`), so you can see whether you usually feel better afterwards.
- **Recently:** your finished quests. Tap one to open its recap, which shows the proof photos you took (`Entry` in `src/features/dashboard/you-bits.tsx`). Photos are kept on disk and only served to people on that quest (`src/app/api/media/[id]/route.ts`).

## The UI, briefly

- `src/app/` holds the pages, one folder per URL. Each page just renders a screen from `src/features/`.
- `src/components/ui/` holds the shared pieces: the app shell and bottom nav, buttons, cards, the sheet, the odometer numbers and the hero.
- `src/app/globals.css` holds the design tokens: colours for light and dark mode, radii and fonts. Screens use token names like `text-ink-muted`, not raw colours, so everything looks like one app.
- Motion uses the `motion` library and respects "reduce motion". The maps are `maplibre-gl`.

## Deploying

Vercel hosts the app at https://amble.health and deploys every push to `main` (`vercel.json` skips every other branch). A production build first runs `scripts/db-migrate.ts` against Tiger Data, then `next build`. Secrets are Vercel environment variables, never in the repo. Because Vercel functions have no lasting disk, proof photos and videos are stored in the database (`uploads` table, `src/lib/uploads.ts`), and the phone shrinks photos before sending because Vercel refuses uploads over 4.5 MB (`src/lib/shrink-photo.ts`). Every outside service and env var is listed in `docs/DEPLOYMENT.md`.

## Testing

`scripts/smoke.ts` drives the whole product over HTTP as a dozen made-up people: matching, two people accepting at the same moment, proof, coins, access checks, data export and deletion. Run `BASE_URL=http://localhost:3001 bun run smoke`. On Nov 7 evening it passed 85 of 86. The one failure is item 8 in the [JUDGING audit](JUDGING.md#audit-what-a-judge-sees-today): the starter pack no longer has any anywhere quests. `bun run check` runs types and lint.

## How we used AI to build it

We used Claude Code, an AI coding assistant, heavily, with many sessions in parallel, each in its own git worktree and branch, merged through small pull requests. The humans made the product decisions: the idea, which focus areas, the safety rules, the metrics and why, the quests themselves, and what to cut. The AI also runs inside the product (quests, proof, recaps). Both are disclosed on Devpost. Saying this plainly is better than being caught out.

## Questions judges will ask

Keep each answer to two sentences. Two minutes of Q&A is about four questions.

**"How do you stop creeps?"** You meet at a public quest spot, never at each other's location, and your partner only sees a rough distance and, after both say yes, a first name. Meeting strangers needs 18+ and a verified email, and happens in daylight only. Report is one tap away, ends the quest, and you're never paired with that person again.

**"What if nobody's nearby?"** On a campus at 11 AM there's density, which is why the pilot is one campus. Crews and invite links work with zero strangers around, and "anywhere" quests work alone. In the demo, Priya is a labelled practice partner.

**"Can't people fake the photo?"** The server first checks the photo was taken near the place and during the quest, and the AI then checks it shows the task, rejecting screenshots. Someone could still fake it, but the reward is coins on a friendly board, so it isn't worth it.

**"What does the AI cost per user?"** One call writes several quests for an area, and they're shared with everyone within 1 km for 6 hours. Proof is one small image call. *(Quote the measured figure from Devpost here, once someone has measured it.)*

**"What happens when the AI is down or wrong?"** Quests fall back to our hand-written starter pack, proof counts anyway and says so, and the recap falls back to a plain summary. Every call has a timeout, so nothing hangs.

**"Why would anyone open it twice?"** Familiar faces: the second time you're matched with someone, the app notices, and friendship is time spent together.

**"How is this different from Meetup or Bumble BFF?"** Those ask you to plan a meeting and make conversation. We give two people a 20-minute task right now, so there's something to do besides small talk, and no planning.

**"Why these metrics?"** Each one comes from research on what helps: the national 150-minute guideline, Hall's hours-to-friendship, and mood before and after. We avoid follower counts and streaks, because they punish quiet weeks.

**"Is Priya a real person?"** No. She's a bot partner, so a judge alone can try the whole flow. The app says so on screen.

**"Where does location go?"** It's kept while you're searching and deleted the moment you're matched. During a quest it's recorded only to measure your own walk, shown only to you, and deleted after 30 days on Tiger Data.

**"Why Next.js, Postgres, Auth0?"** One deployable app with typed contracts on both sides, real SQL with transactions and locks for the race conditions in matching, and login we don't have to build or secure ourselves. Tiger Data gives us automatic expiry for location data.

**"Walk me through what happens when I tap 'I'm free'."** Use the System 1 steps above: `setFree` stores your location for 20 minutes, `warmQuests` starts the AI writing, `tryPair` takes a lock and pairs you with the nearest person, and the locations are deleted.

**"How does it scale to another city?"** Nothing is tied to Calgary except the starter pack. Quests come from OpenStreetMap places near any point, cached per area, and the server has no state outside Postgres.

**"Show me where X is in the code."** Each of us should be able to open these without searching: `src/server/matching.ts` (pairing), `src/server/proof.ts` (proof checks), `src/lib/quest-safety.ts` (AI safety), `src/lib/places.ts` (real places), `src/server/users.ts` (delete my data).

**"Did you write this, or did AI?"** Both, and it's disclosed. We used Claude Code to write a lot of the code quickly. We designed the product, the safety rules, the metrics and the quests, and we can explain every part, which this conversation is showing.
