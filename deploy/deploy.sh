#!/usr/bin/env bash
# Deploys main if it has moved. A timer runs this every minute. Each commit is
# built in its own folder, and the site only switches over if the build passes,
# so a broken merge never takes the live site down.
set -euo pipefail

ROOT=/opt/amble
cd "$ROOT/repo"

git fetch --quiet origin main
target=$(git rev-parse origin/main)
current=$(cat "$ROOT/deployed" 2>/dev/null || true)
failed=$(cat "$ROOT/failed" 2>/dev/null || true)
[ "$target" = "$current" ] && exit 0
[ "$target" = "$failed" ] && exit 0 # don't rebuild the same broken commit every minute

release="$ROOT/releases/$target"
echo "deploying $target"
rm -rf "$release"
mkdir -p "$release"
git archive "$target" | tar -x -C "$release"
ln -sfn "$ROOT/shared/.env" "$release/.env"

cd "$release"
set -a
# shellcheck disable=SC1091
source "$ROOT/shared/.env"
set +a

if ! { bun install --frozen-lockfile && bun run build; }; then
  echo "build failed, staying on ${current:-nothing}"
  echo "$target" > "$ROOT/failed"
  rm -rf "$release"
  exit 1
fi

if [ -n "${DATABASE_URL:-}" ]; then
  seed=""
  [ -n "${DEMO_MODE:-}" ] && seed="--seed"
  bun scripts/db-migrate.ts $seed
fi

ln -sfn "$release" "$ROOT/current"
sudo /usr/bin/systemctl restart amble
echo "$target" > "$ROOT/deployed"
rm -f "$ROOT/failed"

# Keep the last three releases.
cd "$ROOT/releases"
ls -1t | tail -n +4 | xargs -r rm -rf
echo "live on $target"
