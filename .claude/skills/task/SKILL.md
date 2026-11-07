---
name: task
description: Claim the next ready task from the board (or a specific one) and implement it in this worktree. Use when asked to pick up, start or work on a task.
argument-hint: "[T-012]"
---

Requested task: $ARGUMENTS (empty means your next ready task)

1. **Check where you are.** You must be in a worktree, not the main checkout. If `git config hack.person` is empty, ask the human who they are and set it.

2. **Claim.** Run `node scripts/task.mjs claim $ARGUMENTS`. It's atomic and switches you onto the task's branch. If it says nothing is ready, show the human `node scripts/task.mjs list` and stop. Don't pick a blocked or claimed task instead.

3. **Read the brief** it prints, plus `CLAUDE.md` and the parts of `docs/PLAN.md` it links to. Look at the contracts it uses. If the brief is ambiguous in a way that changes what you build, ask now.

4. **Build it.** Stay inside the `owns` paths. Commit and push after each working step. If you need something outside your paths, follow "When you need a file you don't own" in `CLAUDE.md`.

5. **Verify** every "Done when" item, and actually run the thing.

6. **Mark it done.** Set `status: done` in your task file and tick the boxes, as the last commit.

7. **Ship.** Follow `.claude/skills/ship/SKILL.md`.

If you can't finish, push what you have and tell the human where it stands. To abandon the task entirely, run `node scripts/task.mjs release <id>` so someone else can claim it.
