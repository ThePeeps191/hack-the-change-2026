# Plan

**Status: not started.** Product context is in [IDEA.md](IDEA.md).

To fill this in, ask a Claude session to plan the project:

1. Work back from the demo. A thin version of the whole loop beats complete pieces that don't connect.
2. Make wave 0 the foundation: the scaffold, all dependencies, shared contracts, a stub directory with mock data for every feature, and design tokens. Add the contracts, manifest and lockfile to `docs/shared-paths.txt`.
3. Write one `docs/tasks/T-012-short-slug.md` per task from `docs/tasks/_TEMPLATE.md`. Each brief has to stand alone, and tasks that can run in parallel can't own the same files.
4. Run `node scripts/task.mjs check-plan` to confirm no parallel tasks share a path.

The plan changes rarely and only through a hot branch. Live progress is not tracked here: run `node scripts/task.mjs list`.

## Demo target

What the judges see, step by step. Anything not on this path is a stretch goal.

## Scope

- **Must have:**
- **Stretch:**
- **Cut:**

## Decisions

| Question | Decision | Why |
| --- | --- | --- |
| Product name | | |
| Framework and language | | |
| Package manager | | |
| Keep hide and seek? | | |
| TensorFlow vision model? | | |
| Motion context now or later? | | |

## Architecture

Main pieces and how data moves between them.

## Repo layout

Which directory holds what. Each feature gets its own directory, and new features are found by convention, so adding one never means editing a central list.

## Contracts

The types, API shapes and database schema that tasks share, and the files that define them. Wave 0 creates these before parallel work starts.

## Lanes

| Person | Area |
| --- | --- |
| Danny | |
| Siddhant | |
| Aaron | |
| Jonas | |

## Waves

| Wave | Goal | Tasks |
| --- | --- | --- |
| 0 | Foundation: scaffold, contracts, stubs, deploy | |
| 1 | | |

## Integration

Who merges what near the deadline, when features freeze, and who owns the demo run-through.
