# hack-the-change-2026

A project built in 24 hours for Hack the Change 2026. See [the idea](docs/IDEA.md) and [the plan](docs/PLAN.md).

## Setup

Once per clone:

```sh
git config hack.person danny   # or siddhant, aaron, jonas
```

Put your keys in `.env`, which is gitignored and copied into new worktrees automatically. This repo is public, so never commit them.

## Working

Each terminal is one agent on one task. Run `claude -w`, then ask it to claim the next task. It follows [CLAUDE.md](CLAUDE.md): it commits as it goes, then opens a PR, merges it and deletes its branch.

| Command | What it does |
| --- | --- |
| `node scripts/task.mjs list` | Shows who's doing what |
| `node scripts/task.mjs claim` | Claims your next ready task |
| `node scripts/task.mjs cleanup` | Clears merged branches and worktrees |
