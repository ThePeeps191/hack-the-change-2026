<p align="center">
  <img src="public/icons/icon-192.png" alt="The Amble icon: a lowercase a with the sun in its bowl" width="96" height="96">
</p>

<h1 align="center">Amble</h1>

<p align="center">Twenty minutes, someone new, somewhere outside.</p>

<p align="center">
  <a href="https://amble.health">amble.health</a> ·
  <a href="https://devpost.com/software/9dszkw-small-usage-limits-big-dreams-amble">Devpost</a> ·
  Built in 24 hours at Hack the Change 2026, Calgary
</p>

<p align="center">
  <img src="docs/images/foosball-game.gif" alt="Two people playing foosball in the engineering building at UCalgary, the real place behind one of Amble's quests" height="480">
  <img src="docs/images/app-demo-aaron-and-siddhant.gif" alt="Amble on a phone: Aaron picks a quest and gets matched with Siddhant, and a real photo of the game gets checked: that counts, plus 15 coins" height="480">
</p>

Amble gives strangers short, fun challenges to do together outside. When you have some time, you tap "I'm free", get paired with someone nearby, and meet them at a public spot to do the challenge. One of ours, at the Foothills Athletic Park: "Film each other running 100 m backwards on the track, then play the videos in reverse to see whose run looks more normal."

You can also start a crew with your friends and compete with other crews to claim spots around campus.

## Try it

Open [amble.health](https://amble.health) on your phone and tap Try the demo. You don't need an account. If nobody else is free, a practice partner called Priya plays along, so you can go through the whole thing by yourself. In Chrome on Android you can also install it like an app.

## Why we built it

23% of Canadians aged 15 to 24 always or often feel lonely, the highest of any age group ([Statistics Canada](https://www.statcan.gc.ca/o1/en/plus/274-you-are-not-alone)). In Calgary it's 26% of 18 to 34 year olds ([City of Calgary, 2025](https://www.calgary.ca/content/dam/www/programs-services/social-programs-and-services/mental-health-and-addiction-strategy/mental-health-calgarians-final-report-2025.pdf)). And only 46% of Canadian adults get the recommended 150 active minutes a week ([Statistics Canada](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021-eng.htm)). We wanted one app that goes after both problems.

We were inspired by AR games like Pokemon Go, and the challenges especially by the game show Jet Lag: The Game, which is full of collaborative challenges tied to real places.

We built it for Prompt 1 of Hack the Change, under community connection and inclusion, and proactive health and wellness.

## How a quest works

Tap "I'm free" and Amble looks for someone nearby. All you see at first is a rough distance, then a first name once you both say yes. You both get the same quest at a public place and meet there, never at each other's location. Each of you can add one line so the other can spot you, like "red jacket, by the main doors". If nobody's around, Amble tells you, and you can send the quest to someone you're with by link or AirDrop.

When you've done it, you send a photo or short video and Claude Haiku checks it against the quest. If it passes, you get coins. Then you see a short recap of the quest, how long you were active and how you felt before and after, which only you can see. You can choose to stay in touch, and you only connect if you both say yes.

<p align="center">
  <img src="docs/images/aaron-and-siddhant/that-counts.jpg" alt="The AI referee approves a real photo of two people playing foosball: that counts, with a reason naming what it can see" width="250">
  <img src="docs/images/aaron-and-siddhant/rejected-ping-pong.jpg" alt="The AI referee rejects a real photo of two people playing ping pong for a foosball quest, and says what would count" width="250">
  <img src="docs/images/aaron-and-siddhant/claim.jpg" alt="The Claim map of campus, with flags for the zones each crew holds" width="250">
</p>

<p align="center"><sub>The same foosball quest with two real photos. We sent the ping pong one on purpose.</sub></p>

## Crews and Claim

Crews share quests and earn coins together, and the coins go toward a weekly board. Claim is a second game where two crews compete for spots around campus. Each spot has a challenge, for example "Hold a plank for as long as possible and record it. Longer plank wins." If nobody holds a spot, finishing the challenge takes it. If another crew holds it, you have to beat their score to steal it.

## Your numbers

The You tab is private and never ranked against anyone. It shows your active minutes against Canada's 150-minute guideline, your familiar faces (people you've done several quests with), new places you've been, and how you felt before and after each quest.

## Safety and privacy

An app designed to get strangers to meet has to take safety seriously. You only ever meet at a public quest spot. Your partner sees a rough distance, then a first name once you both say yes.

During a quest, one tap opens 911 and UCalgary Campus Security, a way to leave without blaming anyone, and a report. If you report someone, you're never paired with them again.

Your location is deleted the moment you're matched, and routes are deleted after 30 days. You can download or delete everything from the privacy page, which also says which AI sees your photos.

For real accounts, meeting someone new needs a verified email and happens in daylight (8 AM to 5 PM), and proof has to be taken near the spot during the quest. The judging site runs in demo mode, which turns those off so you can try it from a desk at any hour.

There are comfort settings too: step-free places first, an easier pace, and side-by-side quests if you'd rather not chat face to face.

## How we built it

It's one Next.js (TypeScript) app on Vercel. Auth0 handles sign-in, and judges get a signed demo login so they don't need an account. Postgres on Tiger Data stores everything, including proof photos. Location pings go in a TimescaleDB hypertable with a 30-day retention policy, so routes delete themselves, and the You tab's week uses TimescaleDB's `time_bucket`.

There are no background workers. State moves forward when a phone checks in every few seconds: a match expires, a quest ends. Every rule runs on the server inside database transactions, so two phones can't race each other into a bad state. An end-to-end test (`scripts/smoke.ts`) drives the whole product over HTTP as a dozen simulated people.

We wrote every quest by hand, at real public places around UCalgary and Calgary. The AI does two jobs: Claude Haiku checks proof (photos, and three still frames from each video) and writes the recaps. It's told to be generous with honest attempts. Every AI call has a timeout and a fallback, so if the AI is slow or down the quest still counts. If it gets one wrong in the demo, demo accounts can tap Count it anyway.

Built with Next.js, React, TypeScript, Tailwind CSS, Motion, bun, Postgres, Tiger Data (TimescaleDB), Auth0, Claude Haiku, MapLibre, OpenStreetMap and Vercel.

## AI disclosure

We built Amble with Claude Code as our coding assistant. It wrote much of the code, while we made the product decisions, wrote the quests and other content by hand, and reviewed the changes. Dozens of sessions ran in parallel, each in its own git worktree with small pull requests, using the rules in [CLAUDE.md](CLAUDE.md). At one point our merges used up the hosting platform's daily deploy limit.

## Repository

| Path | What's there |
| --- | --- |
| `src/app/` | Screens and API routes |
| `src/features/` | One folder per feature: matching, quests, proof, recap, crews, Claim, the You tab |
| `src/server/` | The rules: matching, runs, proof, crews, Claim, coins |
| `src/lib/` | Shared types, the API client, and the seams for sign-in, AI and the database |
| `data/quests/` | The hand-written quests |
| `db/migrations/` | The database schema |
| `docs/` | How it works ([TECHNICAL](docs/TECHNICAL.md) for a short summary, [WALKTHROUGH](docs/WALKTHROUGH.md), [ARCHITECTURE](docs/ARCHITECTURE.md)) and how we work ([DEVELOPMENT](docs/DEVELOPMENT.md)) |

## Team

- **Danny Wang** ([@ThePeeps191](https://github.com/ThePeeps191))
- **Siddhant Arora** ([@siddhantarora7](https://github.com/siddhantarora7))
- **Aaron He** ([@mucube](https://github.com/mucube))
- **Jonas Huang** ([@wawahwa801](https://github.com/wawahwa801))
