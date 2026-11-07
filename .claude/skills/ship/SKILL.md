---
name: ship
description: Take the current branch through to merged - update from main, verify, open a PR, run the pr-reviewer agent, fix what it blocks on, merge, delete the branch. Use when work on a branch is finished.
---

1. **Update from main.** Commit everything, then run `git fetch origin && git merge origin/main`. Resolve conflicts here, keeping both sides' intent. A conflict in a file you don't own means something went wrong: stop and tell the human.

2. **Check locally.** Run `node scripts/task.mjs check-plan`, `node scripts/task.mjs check-scope`, and the lint, typecheck, test and build commands from `docs/PLAN.md`. Fix real failures, and don't weaken a test to pass. A `check-scope` failure is a warning: drop stray changes if they're accidental, keep them if they're needed.

3. **Open the PR.** Run `git push`, then `gh pr create --base main --fill` and complete the PR template in the body. If a PR already exists, reuse it.

4. **Get it reviewed.** Spawn the `pr-reviewer` agent with only the PR number, so it forms its own view. Don't pass it your reasoning.
   - On `BLOCK`, fix what's valid, commit, push, and review again. If you disagree with a finding, verify against the code before dismissing it.
   - Stop after two rounds that still end in `BLOCK`. Leave the PR open and tell the human why.
   - Post the final report with `gh pr comment`, and file each non-blocking item you won't fix as a follow-up issue.

5. **Merge.** Only after `PASS`, run `gh pr checks --watch`. If a real check fails, fix it, push, and rerun the reviewer if the fix changed behaviour. Then run `gh pr merge --squash`.

6. **Confirm and clean up.** Check that `gh pr view --json state -q .state` says `MERGED`. Then delete the branch:

   ```
   branch=$(git branch --show-current)
   git fetch --prune origin
   git ls-remote --exit-code --heads origin "$branch" && git push origin --delete "$branch"
   git switch --detach origin/main
   git branch -D "$branch"
   ```

7. **Report** the PR link, what shipped, how it was verified, and any follow-ups. Tell the human this worktree is finished, so they can exit the session.
