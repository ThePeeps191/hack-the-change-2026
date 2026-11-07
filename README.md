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

## Working

Each terminal is one Claude session on one thing. Name the session after yourself and what it's building:

```sh
claude -w danny-quest-card
```

Add `--dangerously-skip-permissions` to skip permission prompts. Then tell it what to build, for example "build the quest card screen" or "pick the next thing in the Gemini area".

The session follows [CLAUDE.md](CLAUDE.md): it renames its branch to `danny-quest-card`, commits as it goes, opens a PR, merges it and deletes the branch. Open as many terminals as you can keep track of.

`gh pr list` shows what's in flight. `scripts/cleanup.sh`, run from the main checkout, clears finished worktrees and gets your disk space back.
