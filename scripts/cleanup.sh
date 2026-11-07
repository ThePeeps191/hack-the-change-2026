#!/usr/bin/env bash
# Deletes local worktrees and branches whose PR has merged, to get disk space back.
# Run from the main checkout. Keeps anything with uncommitted or unmerged work.

git fetch --prune --quiet origin
here=$(git rev-parse --show-toplevel)

# True if this branch's latest commit is the one that was merged.
merged() {
  local head
  head=$(gh pr list --head "$1" --state merged --json headRefOid --jq '.[0].headRefOid' 2>/dev/null)
  [ -n "$head" ] && [ "$head" = "$(git rev-parse "$1")" ]
}

removed=0
path=""
branch=""
while read -r key value; do
  case "$key" in
    worktree) path=$value; branch="" ;;
    branch) branch=${value#refs/heads/} ;;
    "")
      if [ -n "$branch" ] && [ "$path" != "$here" ] && [ "$branch" != main ] && merged "$branch" \
        && [ -z "$(git -C "$path" status --porcelain)" ]; then
        git worktree unlock "$path" 2>/dev/null # Claude Code locks its worktrees
        git worktree remove "$path" && git branch -qD "$branch" && removed=$((removed + 1))
      fi
      ;;
  esac
done < <(git worktree list --porcelain; echo)

for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
  [ "$branch" = main ] && continue
  git worktree list --porcelain | grep -qx "branch refs/heads/$branch" && continue
  if merged "$branch"; then
    git branch -qD "$branch" && removed=$((removed + 1))
  fi
done

git worktree prune
echo "Cleaned up $removed merged branch(es)."
