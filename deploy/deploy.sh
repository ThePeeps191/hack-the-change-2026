#!/usr/bin/env bash
# Deploys main if it has moved. A timer runs this every minute. Each commit is
# built in its own folder, and the site only switches over if the build, the
# migrations and a health check all pass, so a broken merge never takes the live
# site down.
set -uo pipefail

ROOT=/opt/amble
PREVIOUS=$(readlink "$ROOT/current" 2>/dev/null || true)

cd "$ROOT/repo" || exit 1
git fetch --quiet origin main || exit 1
target=$(git rev-parse origin/main)
current=$(cat "$ROOT/deployed" 2>/dev/null || true)
failed=$(cat "$ROOT/failed" 2>/dev/null || true)
[ "$target" = "$current" ] && exit 0
[ "$target" = "$failed" ] && exit 0 # don't rebuild the same broken commit every minute

release="$ROOT/releases/$target"

# Marks this commit as broken and leaves the live site as it was.
give_up() {
  echo "deploy of $target failed: $1. Staying on ${current:-nothing}."
  echo "$target" > "$ROOT/failed"
  rm -rf "$release"
  exit 1
}

echo "deploying $target"
rm -rf "$release"
mkdir -p "$release"
git archive "$target" | tar -x -C "$release" || give_up "couldn't unpack"
# Next and bun both read .env from the folder they run in. Never source it in a
# shell: a database URL with & in it would break.
ln -sfn "$ROOT/shared/.env" "$release/.env"

cd "$release" || give_up "no release folder"
bun install --frozen-lockfile || give_up "install failed"
bun run build || give_up "build failed"
bun scripts/db-migrate.ts --if-configured --seed-in-demo || give_up "migrations failed"

ln -sfn "$release" "$ROOT/current"
sudo /usr/bin/systemctl restart amble

# Roll back if the new version doesn't come up.
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 http://localhost:3000/api/health > /dev/null; then
    echo "$target" > "$ROOT/deployed"
    rm -f "$ROOT/failed"
    # Pick up changes to these deploy scripts for next time.
    git -C "$ROOT/repo" checkout --quiet --detach "$target"
    cd "$ROOT/releases" && ls -1t | tail -n +4 | xargs -r rm -rf # keep the last three
    echo "live on $target"
    exit 0
  fi
  sleep 2
done

echo "health check failed, rolling back"
if [ -n "$PREVIOUS" ]; then
  ln -sfn "$PREVIOUS" "$ROOT/current"
  sudo /usr/bin/systemctl restart amble
fi
echo "$target" > "$ROOT/failed"
exit 1
