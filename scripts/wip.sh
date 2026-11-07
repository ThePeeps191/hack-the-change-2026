#!/bin/sh
# Lists what everyone is working on: the docs/wip/<branch>.md file on every
# pushed branch. Each branch carries its own file, so nothing ever conflicts.
# Usage: scripts/wip.sh
git fetch -q --prune origin
found=0
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin); do
  branch=${ref#origin/}
  [ "$branch" = "HEAD" ] || [ "$branch" = "main" ] || [ "$branch" = "origin" ] && continue
  note=$(git show "$ref:docs/wip/$branch.md" 2>/dev/null) || continue
  found=1
  echo "──── $branch ($(git log -1 --format='%cr' "$ref"))"
  echo "$note"
  echo
done
[ "$found" = 0 ] && echo "No work in progress has a docs/wip note yet. Also check: gh pr list"
exit 0
