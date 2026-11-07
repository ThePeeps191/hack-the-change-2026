# hack-the-change-2026

A project built in 24 hours for Hack the Change 2026. See [the idea](docs/IDEA.md) and [the plan](docs/PLAN.md).

## Setup

Once per clone:

```sh
git config hack.person danny   # or siddhant, aaron, jonas
```

Put your keys in `.env`, which is gitignored and copied into new worktrees automatically. This repo is public, so never commit them.

## Working

Each terminal is one agent on one task:

```sh
claude -w        # starts a session in a new worktree
/task            # claims your next ready task and builds it
```

The agent commits as it goes, then opens a PR, runs the review agent, merges and deletes its branch. Open as many terminals as you can keep track of.

| Command | What it does |
| --- | --- |
| `/split-plan` | Turns the idea into a plan and conflict-free tasks. Run once. |
| `/task [T-012]` | Claims a task and implements it |
| `/ship` | Takes the current branch through review to merged |
| `node scripts/task.mjs list` | Shows who's doing what |
| `node scripts/task.mjs cleanup` | Clears merged branches and worktrees |

The rules agents follow are in [CLAUDE.md](CLAUDE.md).
