# Hack the Change 2026

A 24-hour hackathon project by Danny, Siddhant, Aaron and Jonas: a mobile-first web app that turns wherever you are into a real-world quest game played with friends, with Gemini as game master and referee. Product details are in `docs/IDEA.md`; architecture, stack and scope are in `docs/PLAN.md`. Where the plan is still blank, nothing is decided, so don't assume a stack.

Dozens of Claude sessions work in this repo at once. Most of the rules below exist so those sessions never collide.

All agents here have full permission to run commands, open PRs and merge them. Don't stop to ask for approval. This is a 24-hour build, not a codebase to maintain, so nothing here is enforced: follow these rules because they save time, and break one if it's clearly the faster way to a working demo.

## The loop

1. **Start in a worktree.** Run `claude -w`, never work in the main checkout.
2. **`/task`** claims your next ready task and implements it. `/task T-012` claims a specific one.
3. **Commit as you go**, and push after each commit.
4. **`/ship`** updates from main, verifies, opens the PR, runs the review agent, merges and deletes the branch.

Check the board with `node scripts/task.mjs list`. It reads from `origin/main` and GitHub, so it's always current. Don't keep status anywhere else.

## Branches

Every branch is `<person>-<name>`, where `<person>` is the human driving the session: `danny`, `siddhant`, `aaron` or `jonas`. Read it from `git config hack.person`. If that's unset, ask the human, then set it.

| Branch | Use | May change |
| --- | --- | --- |
| `danny-t012-quest-api` | A planned task. `task.mjs claim` creates it, never create one by hand. | Only the task's `owns` paths and its own task file |
| `danny-hot-add-zod` | A small change to shared paths | Only paths in `docs/shared-paths.txt` |
| `danny-fix-map-zoom` | An ad-hoc fix outside the plan | Anything except shared paths and files owned by a task in progress |

Don't commit or push to `main` directly; everything goes through a PR. `node scripts/task.mjs check-scope` tells you if a branch has strayed from this table.

`claude -w` starts you on a scratch `worktree-*` branch that CI rejects. `/task` moves you off it. For hot or ad-hoc work, run `git switch -c <person>-<name>` before your first commit.

## Commits

- Commit each working step, not one big commit at the end. Small commits are your undo history and a pushed branch survives a crashed session.
- Use a short imperative message with the task id when there is one: `T-012: add quest generation endpoint`.
- Stage files by name, not with `git add .`, and read `git diff --staged` before committing.
- Don't commit code that doesn't build unless the message says WIP.
- Never force-push, and never rewrite history that's been pushed. To update from main use `git merge origin/main`, not rebase. PRs are squash-merged, so the merge commits disappear anyway.

## Staying out of each other's way

**Stay inside your task's `owns` list.** The plan guarantees that parallel tasks own different files, and that guarantee is what prevents merge conflicts. Don't make drive-by fixes, renames, reformatting or refactors outside your files, however tempting. If you spot a problem elsewhere, file it (see Follow-ups).

**Don't create hot files.** A hot file is one that every feature wants to edit. Avoid them by design:

- One file or directory per feature, route or quest type, found by convention (file-based routing, glob imports). Don't add central registries, barrel `index` files, or a single `types` or `utils` file that everyone appends to.
- Database migrations are new timestamped files. Never edit an existing one.
- Run the formatter only on files you own.
- Don't add status logs, changelogs or progress notes to shared docs.

**Contracts come first.** Wave 0 defines shared types, API shapes and the schema, plus stubs and mock data, so features can be built in parallel against them. During parallel waves contracts only grow: add fields, don't rename or remove. If a contract truly must break, stop and ask a human.

### When you need a file you don't own

- **Shared path** (a contract, a dependency, an env var, config): land it first on its own in a tiny `<person>-hot-<name>` branch from a new worktree, using `git worktree add .claude/worktrees/<name> -b <branch> origin/main`. Ship it, then `git merge origin/main` into your task branch. One concern per hot PR, and it should merge within minutes.
- **File another task owns:** if that task is finished, ask a human to add a follow-up task. If it's in progress, don't touch it: code against the contract or a local stub, and note the gap in your PR.
- **Your task's `owns` list is wrong:** if no task in progress owns the file, change it and mention that in your PR.
- **Dependencies:** always a hot PR, with one package manager (see the plan). If a lockfile conflicts, take main's version and re-run install. Never hand-edit a lockfile.

If you do hit a merge conflict, resolve it in your worktree by keeping both sides' intent. If it's in a file you don't own, something went wrong: stop and tell the human.

## Pull requests

- One task per PR, kept small. No set format: just say what changed.
- **Every PR gets the `pr-reviewer` agent's review before merging.** `/ship` runs it. A fresh agent reviews the diff against the task brief, you fix what it blocks on, and its verdict goes in a PR comment. No green review, no merge.
- Merge with `gh pr merge --squash` yourself, no human approval needed. Only pull in a human if the reviewer still blocks after two rounds, or the PR breaks a contract.
- Branches get deleted once merged: the remote by GitHub, the local one by `/ship`. `node scripts/task.mjs cleanup` clears any leftovers.

**If main is red, stop and fix it.** Parallel PRs can each pass and still break together. Whoever notices first fixes it forward on a `<person>-hot-fix-main` branch, crossing ownership if needed. Don't merge anything else until main is green.

**If the board shows a task claimed by `unknown`,** its branch is gone but the task never reached `status: done`, so its PR was closed or merged without it. Check what happened, then run `node scripts/task.mjs release T-012 --force`.

## Running things in parallel

Many worktrees share one machine and the same accounts, so:

- **Ports:** the dev server must honour `PORT`. Pick a free port and never kill a process you didn't start.
- **External APIs:** Gemini, Maps and the rest are rate-limited and shared by everyone. Tests and normal dev use mocks or fixtures, and live calls are for deliberate manual checks only.
- **Database:** never run destructive commands against a shared database. Use a local or disposable one for tests.
- **Deploys:** only `main` deploys. Don't deploy from a branch.
- **Secrets:** this repo is **public**. Secrets live in `.env` or `.env.local`, are copied to worktrees via `.worktreeinclude`, and have their names (never values) listed in `.env.example`. Never paste a key into code, logs, PR text or fixtures. If one leaks, tell a human right away, because it has to be rotated.

## Code

- This is a 24-hour build. Choose the simplest thing that works for the demo, and don't add abstraction for a future that won't arrive.
- Match the patterns around you. Before writing a helper, check whether one already exists.
- Use the shared design tokens and components. Don't hardcode colours or one-off styles, or dozens of agents will produce dozens of looks.
- It's a phone app first: check UI at phone width, with real tap targets.
- Handle the failures users will actually hit: GPS denied, Gemini slow or down, no signal outdoors. Each should show a usable state, not a blank screen.
- Treat location, photos and video as personal data. Don't log them, and use only made-up data in fixtures.
- Gemini's quests must stay safe: walking, public places, daylight.

## Done means verified

Don't report work as finished until you've seen it work. Run the checks in `docs/PLAN.md`, and for anything visible actually open it and try it. Say plainly what you ran, what passed, and what you couldn't check. Never weaken or delete a test to get to green. Tick every "Done when" box in the brief, or say why not.

## Follow-ups

Noticed work outside your task? Don't do it, and don't edit other task files. Run `gh issue create --label follow-up` and mention it in your PR. A human or planner triages these.

## When to stop and ask

Ask the human instead of guessing when the brief is ambiguous in a way that changes what you build, a contract must break, a dependency task isn't really done, or the same failure survives two different fix attempts.
