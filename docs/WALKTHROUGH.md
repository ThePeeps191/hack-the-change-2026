# Walkthrough: how Amble works, for explaining it out loud

The rules say a team can be disqualified if any member can't explain the code or the design. Every one of us should be able to answer any question in this file without looking. [ARCHITECTURE.md](ARCHITECTURE.md) is the short version for developers. This page is the long version for talking to judges.

If you change how something works, update the section here that describes it.

## The one-minute version

Amble is one website, built with Next.js. On a phone you say "I'm free for 20 minutes". The server finds the nearest other person who's free, gives you both the same short quest at a public place, and an AI checks your photo when you've done it. Then you see a recap. Crews of friends earn coins together and compete for spots on a campus map, which is the Claim game.

There's one server and one database, and there are no background jobs. The phone asks the server for updates every few seconds, and every rule lives on the server, so the phone can't cheat.

## The layers, from the phone down

Think of a request travelling down through five layers:

```
1. Screen         src/features/<feature>/*.tsx      what you see and tap
2. API client     src/lib/api.ts                    one function per endpoint, so screens never call fetch
3. Route          src/app/api/**/route.ts           about 10 lines: who are you, read the input, call the server
4. Server rules   src/server/*.ts                   every decision: matching, runs, proof, coins, Claim
5. Database       src/lib/db.ts                     one query() function, which talks to Postgres
```

On the side are the AI (`src/lib/ai.ts`), login (`src/lib/auth.ts`) and real places (`src/lib/places.ts`).

**How to explain it:** "Screens never know about the database, and routes never contain rules. If you want to change behaviour, you go to `src/server/`. That's why four people and a lot of AI help could work in parallel without breaking each other's code."

**Why Next.js?** The pages and the API live in one project and deploy as one thing, so there's less to connect and less to break during a 24-hour build. It's TypeScript end to end, so the shared types in `src/lib/contracts.ts` are checked on both sides.

## The shared contract

`src/lib/contracts.ts` defines the shapes everyone agreed on at the start: `Quest`, `Match`, `QuestRun`, `Verdict`, `Recap` and so on. `docs/CONTRACTS.md` explains them. Contracts only ever grow: new fields are optional, so nothing breaks. For example, `Match.demo_partner` was added late so the screen could say Priya is a practice partner.

## System 1: meeting someone new, step by step

This is the main demo. Each step names the function that does it.

1. **"I'm free."** The phone asks for GPS (`getPosition` in `src/lib/geo.ts`). If that's denied or slow, it falls back to the middle of campus and says so on screen. It then calls `POST /api/availability`, which runs `setFree` in `src/server/matching.ts`. That stores your location for 20 minutes, after `assertCanMeet` in `src/server/safety.ts` has checked your email is verified and that it's daylight (both skipped in demo mode).
2. **Quests are hand-made.** The AI never writes them: the pair gets the nearest starter quest from `data/quests/quests.json` that suits both people (`pickPairQuest` in `src/server/quests.ts`).
3. **Finding someone.** The match screen asks `GET /api/match` every 3 seconds (`currentMatch`). That calls `tryPair`, which takes a database lock, so two people searching at the same moment can't both grab the same third person. It then finds the nearest free person within 2 km, adds a penalty when comfort settings clash (chatty versus side by side), skips anyone you've reported or just turned down, and creates a match. **Both people's locations are deleted at that moment.**
4. **What you see before saying yes:** a rough distance and nothing else. Your partner's name only appears once you've both said yes (`toMatch`).
5. **Both say yes.** The second "yes" calls `finalize`. In one database transaction it picks a quest that fits both people's settings (`pickPairQuest`, then `chooseForPair`) and creates the run, so two taps at the same moment can't create two runs.
6. **During the quest,** `RunTracker` (`src/features/quests/run-tracker.tsx`) sends your location in batches, and only while a quest is active. That's what the "km walked" in the recap comes from. To find each other at a busy spot without sharing anything else, each of you can add one short line like "red jacket, by the main doors" (`SpotMe` in `src/features/quests/spot-me.tsx`, saved by `setHint` in `src/server/runs.ts` as `run_members.hint`, up to 80 characters). Your partner sees it on their quest screen; Priya always has one. Deleting your data clears it.
7. **Proof.** You take a photo, and `POST /api/runs/:id/submissions` saves it and replies "pending" straight away. The check happens after the reply, through Next's `after()`, so your phone isn't kept waiting. `judgeSubmission` in `src/server/proof.ts` first checks place and time, which is free and can't be argued with: was the photo taken near the spot, during the quest? Then it asks the AI whether the photo shows the quest being done. If the AI gets it wrong on stage, `DEMO_MODE` adds a quiet "Approve by hand" on the proof screen (`approveByHand`), which also overturns a rejection.
8. **Coins.** `applyVerdict` records the result and calls `awardCoins`. A unique index on `coin_events` means a quest can never pay twice, even if the code runs twice.
9. **Finishing.** `settle` in `src/server/runs.ts` marks the run complete once everyone's proof is approved, or at time-up if your partner never sent theirs, so you still get your recap. Your You page only counts quests where your own proof was approved. It also works out how far each person walked from their own pings.
10. **Recap.** `getRecap` in `src/server/recaps.ts` asks the AI for a two-line story once and keeps it. It shows your own route, never your partner's. Then you can choose to stay in touch, which only connects you if both say yes (`stayInTouch` in `src/server/people.ts`).

**Alone? Priya.** In demo mode, if nobody real is free after about 4 seconds (25 seconds if you signed in with a real account, so two team phones that tap a little apart still find each other; `botWaitMs`), you're matched with Priya, a bot (`src/server/bot.ts`). She says yes, sends proof and opts in to stay in touch, so one person can try the whole flow. The screen labels her as a practice partner. Two real people (`/?as=alice` and `/?as=bob` locally) match each other for real.

## No background workers: why, and how things still move

There's no timer or queue running on the server. State moves forward when someone looks at it: expiring old matches, Priya's moves and finishing a run all happen inside `currentMatch` and `advance`, which the phone triggers by polling. The phone polls anyway, so this costs nothing, and it's one less thing to deploy or break on stage. `usePoll` (`src/lib/use-poll.ts`) keeps the last good answer if the signal drops, so the screen never goes blank outdoors.

## The AI: what it does and what stops it going wrong

All AI calls go through three functions in `src/lib/ai.ts`: `judgeProof` and `writeRecap` (`generateQuests` is still there but nothing calls it: quests are hand-made). Behind them:

- **Mock mode** (`AI_MODE=mock`, the default while building) returns starter quests and a fake verdict after 2 seconds. Dozens of sessions can run without spending anyone's credits.
- **Live mode** uses Gemini (`src/lib/gemini-live.ts`) or Claude (`src/lib/ai-claude.ts`), chosen by `AI_PROVIDER`. **The demo runs Claude.** Claude can't watch video, so for video proof the phone also sends one JPEG of three still frames (start, middle, end; `src/lib/video-frames.ts`) and Claude judges that. If a frame comes out blank, as iPhone Safari sometimes does, no frames are sent and place and time decide.

**Quests are hand-made.** Every quest is in `data/quests/quests.json`, written and checked by us, so the safety rules (public, daylight, walking pace) are ours, not a prompt's. The older AI quest-writing code (`generateQuests`, `src/lib/places.ts`, `toSafeQuest`) is still in the repo, but nothing calls it.

**The AI never blocks a person.** Every call has a timeout. If the proof check fails, the quest counts anyway and the message says so, because nobody should lose a real walk to our outage. If the recap fails, you get a plain one-line summary.

**Cost.** The AI only runs on proof checks and recaps. Token counts are logged on every call (`logUsage`), without any content, so we can quote a real cost per quest.

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

The schema is in `db/migrations/20261107T1500_foundation.sql`. The main tables are `users`, `availability` (who's free, deleted on match), `matches`, `quests`, `quest_runs` and `run_members`, `submissions` (proof), `location_pings`, `crews`, `games` and `zones` (Claim), `coin_events`, `connections`, `reports` and `checkins` (mood).

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

## System 2: crews, coins and Claim

- **Crews** (`src/server/crews.ts`): make one, share a code like `MAPLE-42K`, and friends join. The join page (`/join` or `/join/<code>`) shows the code as letter boxes (`src/features/crews/code-boxes.tsx`): one invisible real input holds the value and the boxes just draw it. It checks the code as you type, so the boxes turn white when it names a crew and shake when it doesn't. Start a quest together and you land on the same run. Starting one also puts it on the crew tab, so crewmates can find it. A crew run stays open for latecomers: it finishes when two or more people are on it and all are done, when the timer runs out, or when someone whose proof is in taps "Finish now" (`finishRun`). A solo quest finishes on its own approval. "Leave crew" at the foot of the crew page (`src/features/crews/leave-crew.tsx`, `leaveCrew`) asks first in a sheet, then deletes your `crew_members` row and nothing else: your coins stay yours and the code still lets you back in. A crew with nobody in it drops off the weekly board.
- **"Try the demo"** (`src/server/demo-crew.ts`): each visitor gets their own copy of the seeded crew, its rival and the Claim game, so one judge's steals never show up for the next. The weekly board shows a copy only to its owner, in place of the seeded crew. A fresh demo login is also how we reset the Claim board between pitch rounds.
- **Coins** come from every finished quest and are paid once (see above). The weekly board (`crewLeaderboard`) only counts the last 7 days, so a quiet week starts everyone level again.
- **Claim** (`src/server/games.ts`): campus spots are zones, each with a challenge and a best score. Each spot and its challenge live together in `data/claim-quests.json` (the `zone` part is the spot), edited on a map at `/claim` in the quest maker. Finish the challenge with approved proof and you take an empty zone. To steal a held zone you have to beat its best score. `attemptZone` locks the zone row so two teams can't take it at once. The crew holding the most zones is winning, and starting a new game ends your crew's old one (`createGame`). The rules in a few lines, for Q&A, are in [CLAIM.md](CLAIM.md).
- **Ratings:** stealing a zone is the one real win and loss in the app, so it's the only place ratings change: Glicko-2 from the `glicko2` package (`rateSteal`). Each crew has one rating. Stranger quests are cooperative and never touch a rating.

## The wellbeing numbers (the You tab)

`getDashboard` in `src/server/dashboard.ts` computes them from real quests. Everything is private and never ranked.

- **Active minutes this week**, against **150**, the Canadian 24-Hour Movement Guidelines.
- **This week's suns:** the seven days at the top of the You tab come from `weekDays` in `src/server/week.ts`. On Tiger Data it groups your finished quests and your GPS pings by day with TimescaleDB's `time_bucket` (in Calgary time), and counts minutes you were moving as one-minute `time_bucket`s on the `location_pings` hypertable. Embedded Postgres has no TimescaleDB, so locally it uses `date_trunc`, and if the TimescaleDB query ever fails it falls back the same way.
- **Familiar faces:** people you've done 2 or more quests with, and your time together, measured against Hall (2019)'s estimate of about 50 hours to become casual friends.
- **New places:** places you visited for the first time, shown as a count on Home.
- **Mood before and after,** from the optional check-in (`checkins`), so you can see whether you usually feel better afterwards. The recap also shows that quest's own before and after side by side, only to you and only if you answered both (`MoodShift` in `src/features/checkin/mood-shift.tsx`, from `mood_before` and `mood_after` in `getRecap`).
- **Quest history:** your finished quests. The same quest with the same partner on the same day folds into one row with a count like ×5, since every "Try the demo" run shares one guest (`collapseRepeats`). Tap one to open its recap, which shows the date and the proof you sent: photos, and videos that play in place (`Entry` in `src/features/dashboard/you-bits.tsx`, `RecapExtras` in `src/features/recap/recap-extras.tsx`). Photos are kept in the database (`uploads` table) and only served to people on that quest (`src/app/api/media/[id]/route.ts`).

## The UI, briefly

- `src/app/` holds the pages, one folder per URL. Each page just renders a screen from `src/features/`.
- `src/components/ui/` holds the shared pieces: the app shell and bottom nav, buttons, cards, the sheet, the odometer numbers and the hero.
- `src/app/globals.css` holds the design tokens: colours for light and dark mode, radii and fonts. Screens use token names like `text-ink-muted`, not raw colours, so everything looks like one app.
- Filled buttons get a tactile look from the `.tb` classes at the end of `globals.css`: one element with two background layers, a soft gradient face inside and a lighter-to-darker 1px shell showing through a transparent border, plus a thin white highlight on top. Pressing swaps in a flat, slightly darker face with a faint inner shadow. `buttonClass` in `button.tsx` adds them, so screens never style a button by hand.
- It's phone-first, but a computer gets the whole screen from 1024px up. The four tab pages put a rail on the left, which also gives Claim its own row (on a phone, Claim is reached from the Crew tab). Most pages use `Split` (`split.tsx`): the sky or map stays put on the left as a rounded card, and the content scrolls on the right. A one-step page passes `wide` to `AppShell` to opt in. The pages that are all sky (finding someone, joining a crew, not found) stretch the sky across the screen with `.sky-stage`, which gathers the content in the middle. The login puts the words beside the glass panes, and the proof screen puts the photo beside the verdict. On a phone, none of this applies.
- The compass in the middle of the nav points at real north on an Android phone. `use-heading.ts` reads an Android phone's compass and the needle turns against the way the phone faces. iPhones only share the compass after a permission prompt, which we chose not to show, so on an iPhone, a laptop, or with reduced motion, the needle just drifts gently.
- Avatars are little animated blob characters (`avatar.tsx`). We hash a person's or crew's name to pick one of 22 shapes and 16 colours, so the same name always gets the same character. The drawing comes from an open-source library (MIT), copied into `src/lib/bots/grokbot.js`. Each shape is defined by a maths function, turned into 72 outline points, and springs move those points, which makes the wobble. The library also makes the bots blink and glance around. With a mouse, their eyes follow it. On a phone, which has no mouse, each one looks somewhere random every 1 to 3 seconds. With "reduce motion" on, they hold still.
- Motion uses the `motion` library and respects "reduce motion". The maps are `maplibre-gl`.

## Deploying

Vercel hosts the app at https://amble.health and deploys every push to `main` (`vercel.json` skips every other branch). A production build first runs `scripts/db-migrate.ts` against Tiger Data, then `next build`. Secrets are Vercel environment variables, never in the repo. Because Vercel functions have no lasting disk, proof photos and videos are stored in the database (`uploads` table, `src/lib/uploads.ts`), and the phone shrinks photos before sending because Vercel refuses uploads over 4.5 MB (`src/lib/shrink-photo.ts`). Every outside service and env var is listed in `docs/DEPLOYMENT.md`.

**Installing it as an app.** Chrome offers "Install app" because of three things: the manifest (`src/app/manifest.ts`, with icons in `public/icons/`), HTTPS, and a service worker (`public/sw.js`, registered by `src/components/register-sw.tsx`). The service worker caches nothing on purpose, so an installed app always runs the latest deploy. `src/app/apple-icon.png` is the home-screen icon on iPhone (Share, then Add to Home Screen). The icon is a lowercase a with the sun in its bowl; its source is `public/icons/amble-icon.svg`, and every PNG and `src/app/favicon.ico` are rendered from it.

## Testing

`scripts/smoke.ts` drives the whole product over HTTP as a dozen made-up people: matching, two people accepting at the same moment, proof, coins, Claim, access checks, data export and deletion. Run `BASE_URL=http://localhost:3001 bun run smoke`. On Nov 7 evening it passed 85 of 86. The one failure is item 8 in the [JUDGING audit](JUDGING.md#audit-what-a-judge-sees-today): the starter pack no longer has any anywhere quests. `bun run check` runs types and lint.

## How we used AI to build it

We used Claude Code, an AI coding assistant, heavily, with many sessions in parallel, each in its own git worktree and branch, merged through small pull requests. The humans made the product decisions: the idea, which focus areas, the safety rules, the metrics and why, the quests themselves, and what to cut. The AI also runs inside the product (quests, proof, recaps). Both are disclosed on Devpost. Saying this plainly is better than being caught out.

## Questions judges will ask

Keep each answer to two sentences. Two minutes of Q&A is about four questions.

**"How do you stop creeps?"** You meet at a public quest spot, never at each other's location, and your partner only sees a rough distance and, after both say yes, a first name. Meeting strangers needs a verified email and happens in daylight only. During the quest, one tap opens "Help, leave or report" (`src/features/quests/report-sheet.tsx`): 911 and UCalgary Campus Security (403-220-5333, 24/7) at the top, "I need to go" to leave without blaming anyone, and a report, which ends the quest and means you're never paired with that person again.

**"What if nobody's nearby?"** On a campus at 11 AM there's density, which is why the pilot is one campus. After 45 seconds with nobody around, the match screen says so and offers an invite link for someone you're with (`src/features/matching/match-screen.tsx`), and stops promising "under a minute" after a minute. Crews and invite links work with zero strangers around. In the demo, Priya is a labelled practice partner.

**"Can't people fake the photo?"** The server first checks the photo was taken near the place and during the quest, and the AI then checks it shows the task, rejecting screenshots. Someone could still fake it, but the reward is coins on a friendly board, so it isn't worth it. For Claim, which has a real winner, you need approved proof and a score that beats the best.

**"What does the AI cost per user?"** One call writes several quests for an area, and they're shared with everyone within 1 km for 6 hours. Proof is one small image call. *(Quote the measured figure from Devpost here, once someone has measured it.)*

**"What happens when the AI is down or wrong?"** Quests are hand-written, so they don't depend on it. Proof counts anyway and says so, and the recap falls back to a plain summary. Every call has a timeout, so nothing hangs.

**"Why would anyone open it twice?"** Familiar faces: the second time you're matched with someone, the app notices, and friendship is time spent together. And your crew's Claim map changes daily.

**"How is this different from Meetup or Bumble BFF?"** Those ask you to plan a meeting and make conversation. We give two people a 20-minute task right now, so there's something to do besides small talk, and no planning.

**"Why these metrics?"** Each one comes from research on what helps: the national 150-minute guideline, Hall's hours-to-friendship, and mood before and after. We avoid follower counts and streaks, because they punish quiet weeks.

**"Is Priya a real person?"** No. She's a bot partner, so a judge alone can try the whole flow. The app says so on screen.

**"Where does location go?"** It's kept while you're searching and deleted the moment you're matched. During a quest it's recorded only to measure your own walk, shown only to you, and deleted after 30 days on Tiger Data.

**"Why Next.js, Postgres, Auth0?"** One deployable app with typed contracts on both sides, real SQL with transactions and locks for the race conditions in matching, and login we don't have to build or secure ourselves. Tiger Data gives us automatic expiry for location data.

**"Walk me through what happens when I tap 'I'm free'."** Use the System 1 steps above: `setFree` stores your location for 20 minutes, `tryPair` takes a lock and pairs you with the nearest person, and the locations are deleted.

**"How does it scale to another city?"** Nothing is tied to Calgary except the starter quests: a new city needs its own hand-made quests in `data/quests/`. The server has no state outside Postgres.

**"Show me where X is in the code."** Each of us should be able to open these without searching: `src/server/matching.ts` (pairing), `src/server/proof.ts` (proof checks), `data/quests/quests.json` (the hand-made quests), `src/lib/ai-claude.ts` (the AI referee and recaps), `src/server/games.ts` (Claim and ratings), `src/server/users.ts` (delete my data).

**"Did you write this, or did AI?"** Both, and it's disclosed. We used Claude Code to write a lot of the code quickly. We designed the product, the safety rules, the metrics and the quests, and we can explain every part, which this conversation is showing.
