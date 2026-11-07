# Plan

This is a starting point, not a contract. If something here stops making sense, change it in a small PR and carry on. The idea itself is in [IDEA.md](IDEA.md), and the shapes everyone shares are in [CONTRACTS.md](CONTRACTS.md). **What the judges score, and what each area owes for it, is in [JUDGING.md](JUDGING.md): read it before choosing what to build next.**

## Timeline

Times are Saturday unless noted, and come from the task split in the Google Doc.

| By | Goal |
| --- | --- |
| 14:30 | Quest format, tables and endpoint list agreed |
| 15:00 | Live site behind the domain, with login working |
| 15:30 | Clickable System 1 screens, and a function that returns 3 valid quests for a location |
| 19:00 | **System 1 end to end:** match, get a quest, submit proof, Gemini confirms. Creating and joining a crew works |
| 23:00 | **System 2 end to end:** create a crew, do shared quests, coins on the leaderboard |
| Sunday morning | Polish, real test runs on campus, submission |

## Kickoff

The scaffold is the one thing everyone waits on, so do it first and keep it small.

1. **Pick areas** from the list below.
2. **One person starts the scaffold** by telling a session: *"Scaffold the app as described in docs/PLAN.md and docs/CONTRACTS.md, then merge it."* That means:
   - the app, with the repo layout below and `bun` set up
   - `src/lib/contracts.ts`, generated from CONTRACTS.md
   - every API route stubbed, returning mock data
   - `AUTH_MODE=mock` and `AI_MODE=mock` working
   - placeholder design tokens
3. **Everyone else uses that time on accounts and direction:**
   - **Backend:** Tiger Data service, Auth0 tenant, Vultr server, domain
   - **Gemini:** API key, then try quest prompts by hand and start listing UCalgary quests
   - **UI:** name, logo, colours and the screen flow
   - **Friends and demo:** Claim rules, zones on campus, a list of testers, the Devpost draft
4. **Read CONTRACTS.md together** and fix what's wrong. It's a first draft to react to.
5. **Share `.env` values directly** with each other, not through git.
6. **When the scaffold merges, fan out.** Everyone opens sessions on their area.

## Work areas

These are the four areas from the Google Doc. They're approximate: who's on what can shift, anyone can pick up anything, and help goes wherever we're behind. The lists are ideas for what to hand a session, and they aren't complete. Check `gh pr list` and the code to see what's already taken.

### UI/UX, metrics and ratings

Design system, logo and mascot, and every screen, mobile-first. This is the biggest job on the team and the one judges see, so build screens first and leave the dashboard and ratings until after 19:00. If it falls behind, the friends and demo area can take the leaderboard UI.

- Design tokens and base components
- App shell: navigation, phone layout, add-to-home-screen
- Home and the "free for 20 min?" screen
- Match found, accept and decline
- Quest card and the 20-minute timer
- Proof capture for photo and video
- Quest finished, stay in touch, report someone
- Map with event icons
- Crew page
- Recap view
- After 19:00: dashboard (quests done, km moved, people met, coins)
- After 19:00: Elo ratings and leaderboards for players and crews, using a library for the maths

**First deliverable:** clickable screens for the System 1 flow by 15:30.

### Backend and infrastructure

API and database, login, matching and deployment.

- Database tables and migrations on Tiger Data
- Auth0 login with student-email verification
- Matching: nearby, free now, both accept
- Invite links for strangers
- Quest runs, submissions and uploads
- Location pings
- Reports
- Vultr deploy, domain and HTTPS

**First deliverable:** live site behind the domain with login working by 15:00.

### Gemini

Everything Gemini does. Keep the prompts and model calls behind plain functions, so the rest of the app can use their mock versions.

- Local quests with Maps grounding
- Event quests with Search grounding
- UCalgary and Calgary starter pack, which is also the fallback when Gemini fails
- Safety rules in the prompt, plus a check on what comes back
- Proof referee for photos, then video, checked against location and time window
- Recaps: summary, route and verified photos, with narration if there's time

Grounded results come with sources that Google expects you to show, so read the Maps grounding docs first. The quest format has a `sources` field for this.

**First deliverable:** a function that returns 3 valid quests for a given location by 15:30.

### Friends, game modes and demo

- Crews: create, then invite by link or QR
- Shared quests: send to friends, do together or race
- Anywhere quests
- Coins and the crew leaderboard
- Claim mode on the map: zones, challenges, stealing a zone
- Adding someone you met on a quest to your crew
- Demo lead: testers tonight, the Devpost write-up, the video

**First deliverable:** creating and joining a crew working by 19:00.

## Scope

- **Must have:** System 1 end to end, then System 2 with crews, shared quests, coins and a leaderboard.
- **Next:** Claim mode, the dashboard, event quests, video proof, recaps with narration.
- **Stretch:** ratings, personas, hide and seek.
- **Not now:** a TensorFlow vision model, motion context.

## Demo

Either live with judges on our domain, or a video filmed on the UCalgary campus. The story is: open the link on a phone, say you're free, get matched, do a UCalgary quest together, submit a photo, watch Gemini confirm it, see the recap, then show the crew leaderboard and the Claim map.

The demo has to survive conditions that real use doesn't, so `DEMO_MODE` should cover these:

- **Judges have no student email.** They need a way past the check, such as a demo login.
- **A judge is alone.** Matching needs two people, so we need a bot partner or a second phone in hand.
- **It's dark or we're indoors.** Calgary's sunset is around 17:00 right now, so the daylight rule would also block our own testing tonight. We need to be able to override the time and the location.
- **Gemini is slow or wrong on stage.** Have starter quests ready, and a way to approve proof by hand.

## Decisions

The doc lists the stack but not a framework. Everything marked *proposed* is a default chosen so the first session can start, so change it now if anyone disagrees. It's much harder to change after the scaffold merges.

| Topic | Decision | Why |
| --- | --- | --- |
| Name | Amble | Keep it in one constant so it's easy to change |
| Hosted services | Gemini, Tiger Data, Auth0, Vultr, GoDaddy Registry domain | From the doc. Auth0 is a sponsor track, so keep it even if a shortcut is tempting |
| App | *Proposed:* one Next.js app in TypeScript, with Tailwind | Pages and API in one repo and one deploy, which means less to integrate |
| Package manager | *Proposed:* bun, for installs only | Fast, and cheap on disk across dozens of worktrees. Install with `npm i -g bun` |
| Database access | *Proposed:* plain SQL migrations and the `postgres` client | ORM migration journals conflict when branches run in parallel |
| AI | Claude Haiku 5.5 while building, Gemini for the demo, behind one seam (`src/lib/ai.ts`, `AI_PROVIDER`) | Cheap and fast to build with; Gemini's Maps grounding and the MLH Gemini prize for the demo. Claude quests use real OpenStreetMap places, since it has no Maps grounding |
| Map | MapLibre GL with free OpenFreeMap tiles | A 3D globe, and no key or quota to manage. Gemini's Maps grounding is separate and needs no map key |
| Live updates | *Proposed:* poll every few seconds | Plenty for matching, and far simpler than websockets |
| Uploads | *Proposed:* disk on the Vultr server | One server is enough for the demo |
| Stranger invites | *Proposed:* share a link through the Web Share API, with QR as a backup | Websites can't call AirDrop directly, but the iPhone share sheet offers it |
| Safety | *Proposed:* 18+ checkbox, student email, report button, and you meet at the quest location rather than at each other's location | The doc leaves this open, and it's the first thing judges will ask about |

## Architecture

One Next.js app on one Vultr server, behind HTTPS on our domain. The browser talks only to our API routes. API routes talk to Tiger Data, Auth0 and Gemini, and all keys stay on the server except the browser-restricted Maps key.

A System 1 quest goes like this:

1. The user says they're free, and the app sends their location to `POST /api/availability`.
2. The server pairs two nearby people, or a stranger opens an invite link. Both apps poll `GET /api/match` until both accept.
3. The server gets a quest from Gemini or the starter pack and creates a quest run.
4. Both people walk to the quest location. Location pings are stored for the route.
5. Each person submits proof. The server checks location and time, then asks Gemini about the photo or video.
6. Gemini's verdict comes back, coins are awarded, and the recap is created.

## Repo layout

```
src/
  app/               pages and API routes, found by file path
  components/ui/     design system
  features/          one folder per feature: matching, quests, proof, recap, crews, claim, dashboard
  lib/               contracts.ts, db, auth, ai (Claude or Gemini)
  server/            the rules: matching, runs, proof, crews, games, dashboard
data/quests/         hand-tuned starter quests, all in quests.json
db/migrations/       timestamped SQL files
deploy/              server setup, see deploy/README.md
scripts/             db-migrate, smoke (tests the whole product over HTTP)
```

## Building in parallel

- **Real by default:** every API route runs the real logic on embedded Postgres, with no setup, so nobody waits on anybody's accounts.
- **Mock login:** `AUTH_MODE=mock` matters beyond speed. Auth0 only accepts callback URLs it knows about, so sessions on random ports can't complete a real login.
- **Mock AI:** `AI_MODE=mock` returns fixtures, so dozens of sessions don't burn through anyone's credits.
- **Own database per worktree:** embedded Postgres in `.data/`, so parallel sessions can't collide. Tiger Data is for the live site. Migrations still only add things.
