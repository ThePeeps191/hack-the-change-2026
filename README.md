# hack-the-change-2026

A project built in 24 hours for Hack the Change 2026. See [the idea](docs/IDEA.md), [the plan](docs/PLAN.md) and [the contracts](docs/CONTRACTS.md).

## Setup

Once per clone:

```sh
gh auth login
git config hack.person danny   # or siddhant, aaron, jonas
npm i -g bun
```

Put your keys in `.env`, using `.env.example` for the names. It's gitignored and copied into new worktrees automatically. This repo is public, so never commit keys.

## Running the app

```sh
bun install
PORT=3001 bun run dev     # pick a free port; mock login and mock Gemini by default
bun run check             # route types, tsc and eslint
bun run build
```

With no `.env` at all, the whole app runs for real on your laptop: embedded Postgres in `.data/` migrates and seeds itself, and mock login and mock Gemini mean no accounts or keys.

- **Alone:** you're Sam, and a bot partner, Priya, matches you after about 4 s, accepts, and sends proof after you do.
- **As two people:** open `/?as=alice` in one tab and `/?as=bob` in another. Each tab stays that person, and they really match each other.
- **To see a rejection:** add `?mock=reject` to a proof URL.
- **To reset:** stop the dev server and delete `.data/`.

Read [how Amble works](docs/ARCHITECTURE.md) to find your way around, and [deploy/README.md](deploy/README.md) for the server.

| Where | What |
| --- | --- |
| `src/lib/contracts.ts` | Shared types from `docs/CONTRACTS.md` |
| `src/lib/api.ts` | Typed client for every endpoint. Screens call this, never `fetch` directly |
| `src/server/` | All the rules: matching, runs, proof, crews, Claim, dashboard |
| `src/lib/config.ts` | `APP_NAME` and other constants |
| `src/lib/gemini.ts`, `auth.ts`, `db.ts` | Server seams with mock and live branches |
| `src/app/api/**` | Thin routes that call `src/server/` |
| `db/migrations/` | The schema, as timestamped SQL files |
| `scripts/smoke.ts` | Tests the whole product over HTTP: `BASE_URL=http://localhost:3001 bun run smoke` |
| `data/quests/*.json` | UCalgary starter quests, one file per place |
| `src/app/globals.css` | Design tokens (`bg-surface`, `text-ink-muted`, `rounded-card`...) |

This is Next.js 16: `middleware` is now `proxy.ts`, and route `params` are a promise. Read `node_modules/next/dist/docs/` before guessing an API.

## Working

Each terminal is one Claude session on one thing. Name the session after yourself and what it's building:

```sh
claude -w danny-quest-card
```

Add `--dangerously-skip-permissions` to skip permission prompts. Then tell it what to build, for example "build the quest card screen" or "pick the next thing in the Gemini area".

The session follows [CLAUDE.md](CLAUDE.md): it renames its branch to `danny-quest-card`, commits as it goes, opens a PR, merges it and deletes the branch. Open as many terminals as you can keep track of.

`gh pr list` shows what's in flight. `scripts/cleanup.sh`, run from the main checkout, clears finished worktrees and gets your disk space back.
