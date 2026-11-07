---
name: split-plan
description: Turn the idea into docs/PLAN.md and a set of task files that can run in parallel without merge conflicts.
disable-model-invocation: true
argument-hint: "[extra guidance]"
---

You are the planner. Your output decides whether dozens of parallel agents collide, so spend your effort on the boundaries between tasks. Extra guidance: $ARGUMENTS

Work in a worktree on a `<person>-hot-plan` branch.

## 1. Understand and decide

Read `docs/IDEA.md` and, if you have access, the Google Doc it links to, since the doc may be newer. Then ask the humans about anything you can't settle: the open questions, the stack, the demo path, and who wants which area. Don't invent answers to product decisions.

## 2. Fill in `docs/PLAN.md`

Work back from the demo. Be ruthless about what's a must-have in 24 hours: a thin version of the whole loop, working end to end, beats complete pieces that don't connect. Include the lint, typecheck, test and build commands agents should run.

Choose a layout where each feature is a directory and new ones are found by convention, so adding a feature never edits a central list.

## 3. Write wave 0

Wave 0 runs before everything else and owns the hot files. Keep it to as few tasks as you can, because everyone is waiting on it. It must leave:

- The scaffold, with dependencies for the whole plan already installed
- All shared contracts: types, API shapes, schema
- A stub directory for every feature, with mock data, so the app runs from the first commit
- Mocks for Gemini and the other external services
- Design tokens and base components
- `.env.example`, stack entries in `.gitignore`, and real checks in `.github/workflows/ci.yml`
- A deploy of `main`
- `worktree.symlinkDirectories` in `.claude/settings.json`, if the chosen package manager is safe with it
- The contracts directory, dependency manifest, lockfile and root config added to `docs/shared-paths.txt`

## 4. Write the tasks

Create one `docs/tasks/T-012-short-slug.md` per task from `docs/tasks/_TEMPLATE.md`.

- **Disjoint files.** Each task's `owns` lists exact files or `dir/**`. Tasks that can run in parallel can't share a path. If two can't be separated, merge them, order them with `depends_on`, or move the shared part into wave 0 as a contract.
- **Self-contained.** An agent sees only `CLAUDE.md` and the brief, so include the context it needs and exact contract locations.
- **Sized for one session,** with checkable "Done when" items.
- **Few dependencies.** Build against contracts and stubs rather than waiting for real implementations. Long chains kill parallelism, so question each `depends_on`.
- **Lanes.** Give each person a coherent area, so they know their part of the code, and use `owner: any` for work anyone can pick up.
- **Keep the end in mind.** Add late tasks that swap stubs for real wiring, and an integration task for the demo path.

## 5. Prove it

Run `node scripts/task.mjs check-plan` and fix everything it reports. It proves no two parallel tasks own the same path. It can't see hidden coupling, so also check by hand: for each pair of tasks in a wave, could one need to edit a file the other owns? Would a new feature have to touch a shared file?

## 6. Hand off

Ship it with `/ship`. Then tell the humans how many tasks there are in each wave, the critical path, what each person starts with, and any risky boundaries you found.
