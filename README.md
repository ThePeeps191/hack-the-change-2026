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

With no `.env` at all, the app runs on mocks: everyone is the made-up user "Sam", and the System 1 flow is clickable end to end (say you're free, a match appears after about 4 s, the partner accepts about 2 s after you). Send `mock_verdict=rejected` with a proof submission to see the rejection state.

| Where | What |
| --- | --- |
| `src/lib/contracts.ts` | Shared types from `docs/CONTRACTS.md` |
| `src/lib/api.ts` | Typed client for every endpoint. Screens call this, never `fetch` directly |
| `src/lib/config.ts` | `APP_NAME` and other constants |
| `src/lib/gemini.ts`, `auth.ts`, `db.ts` | Server seams with mock and live branches |
| `src/app/api/**` | Route stubs returning mock data |
| `src/mocks/` | Fixtures and the in-memory mock store |
| `data/quests/*.json` | UCalgary starter quests, one file per place |
| `tools/quest-maker-server.ts` | `bun tools/quest-maker-server.ts`, then open http://localhost:8744: place quests on a map and every edit saves into `data/quests/` |
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
