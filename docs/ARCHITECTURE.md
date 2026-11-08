# How Amble works

Read this before judging. The rules say an inability to explain any technical design or code can mean disqualification, so everyone on the team should be able to walk through this page. [CONTRACTS.md](CONTRACTS.md) has the exact shapes, and [JUDGING.md](JUDGING.md) has why we built what we built.

## The shape of it

One Next.js app on one server. Phones only ever talk to our API routes, and the routes talk to everything else, so no key except the map key reaches a browser.

```
phone  ->  src/features/*       screens
           src/lib/api.ts       typed client: screens never call fetch themselves
           src/app/api/**       thin routes: sign the user in, parse, call src/server
           src/server/*         all the rules: matching, runs, proof, crews, Claim
           src/lib/db.ts        one query() over Postgres
           src/lib/ai.ts        every AI call, with a mock for development, and the
                                switch between Claude (ai-claude.ts) and Gemini (gemini-live.ts)
```

If you're changing behaviour, you almost always want `src/server/`. Routes stay about ten lines.

## Four decisions worth knowing

**No background workers.** Nothing runs on a timer. Pairing people, expiring matches, the bot partner's moves and finishing a run all happen when a phone polls (`currentMatch` in `matching.ts`, `advance` in `runs.ts`). The app already polls every few seconds, so state moves forward exactly when someone's looking, and there's one fewer thing to deploy or to break on stage.

**One SQL path, two engines.** With `DATABASE_URL` set we use real Postgres (Tiger Data). Without it, each worktree gets embedded Postgres (PGlite) in `.data/`, which migrates and seeds itself. Same SQL either way, so dozens of parallel sessions never share or corrupt state, and nobody needs an account to run the app. Tiger Data is what production uses: `location_pings` is a hypertable there, with a 30-day retention policy so routes delete themselves.

**The AI never blocks a person.** Proof returns `pending` immediately and is judged after the response, using Next's `after()`. Quest writing starts when someone says they're free, while they wait, so a quest is usually ready by the time both say yes. Every AI call has a timeout and a fallback: quests fall back to the starter pack, proof counts anyway and says so, and recaps use a plain summary.

**The server decides, not the phone.** Both people accepting creates the run on the server, in one transaction, so two taps at the same moment can't make two runs. Coins are paid through a unique index, so paying twice is impossible rather than just unlikely.

## System 1, step by step

1. `POST /api/availability` stores your location and starts warming quests for the area.
2. `GET /api/match` is polled. `tryPair` takes a lock, finds the nearest free person within 2 km, and creates a match. **Both availability rows are deleted right there**, so location is only kept for as long as the search needs it.
3. Your partner's name stays hidden until both accept (`toMatch`). You only ever see a rough distance.
4. The second accept calls `finalize`, which picks a quest (`pickPairQuest`, respecting both people's comfort settings) and creates the run and flips the match to `accepted` in one transaction.
5. During the quest, `RunTracker` sends location in batches. These only happen while a quest is active.
6. Proof: `submitProof` saves the file and returns `pending`. `judgeSubmission` checks place and time first, because that's free and can't be argued with, then asks the AI about the media.
7. `applyVerdict` records the result and pays coins. `settle` completes the run when everyone's approved.
8. The recap is written once and kept. It only ever shows your own route.

## Safety, and where it's enforced

| Rule | Where |
| --- | --- |
| Verified student email, daylight | `assertCanMeet` in `safety.ts`, before matching or an invite |
| Meet at the quest, never at each other's location | Location is never sent to the other person. `toMatch` returns distance only |
| Name hidden until both accept | `toMatch` |
| Reporting ends the quest, and you're never paired again | `report` in `people.ts`, and the `not exists` in `tryPair` |
| The AI can't write an unsafe quest | `toSafeQuest` in `quest-safety.ts`, for both providers: blocked words, distance, duration. Claude's quests also only use real places from `places.ts`, with coordinates that never come from the model. Prompts ask nicely; this enforces it |
| Delete everything | `deleteMyData` in `users.ts`, from the "your data" screen |

## Modes

| Setting | What it does |
| --- | --- |
| `AUTH_MODE=mock` (default) | No login. You're Sam, or `/?as=alice` makes that tab Alice, so two tabs can match. Sam gets the bot partner; named users don't |
| `AUTH_MODE=live` | Real Auth0, via `src/proxy.ts` and `currentUser` in `auth.ts` |
| `AI_MODE=mock` (default) | Starter quests and a 2-second fake verdict. No credits used. (`GEMINI_MODE` is the old name and still works) |
| `AI_MODE=live`, `AI_PROVIDER=claude` | Claude Haiku 5.5 (`ai-claude.ts`). Quests at real places: OpenStreetMap when it answers, our curated campus places when it doesn't. Photos are resized to 1568 px. Video proof is checked by place and time only |
| `AI_MODE=live`, `AI_PROVIDER=gemini` | Gemini with Maps and Search grounding (`gemini-live.ts`), including video. The demo runs on this |
| Keys | `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` come from `.env` first, then the shell (`secrets.ts`). `/api/health` reports which, never the key |
| `DEMO_MODE=1` | A "try the demo" login, the bot partner for everyone, no daylight or location rules, `POST /api/runs/:id/approve` |

## Testing it

```sh
PORT=3001 bun run dev                              # terminal 1
BASE_URL=http://localhost:3001 bun run smoke       # terminal 2
```

`scripts/smoke.ts` drives the whole product over HTTP as a dozen made-up people, including two people accepting at the same moment, access checks and deleting your data. Run it after any change to `src/server/`.

To reset your local database, stop the dev server and delete `.data/`.
