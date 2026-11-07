#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu server. Run as root:
#   curl -fsSL https://raw.githubusercontent.com/ThePeeps191/hack-the-change-2026/main/deploy/setup.sh | DOMAIN=example.com bash
# Then put your values in /opt/amble/shared/.env and run: systemctl start amble-deploy
set -euo pipefail

: "${DOMAIN:?set DOMAIN to the address of the site, for example amble.example.com}"
REPO=https://github.com/ThePeeps191/hack-the-change-2026.git

apt-get update
apt-get install -y curl git unzip debian-keyring debian-archive-keyring apt-transport-https gnupg

# Node 22 runs the app, and bun installs packages.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash

# Caddy gets and renews the HTTPS certificate by itself.
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

id amble >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/amble --shell /usr/sbin/nologin amble
mkdir -p /opt/amble/shared/uploads /opt/amble/shared/pglite /opt/amble/releases
[ -d /opt/amble/repo ] || git clone "$REPO" /opt/amble/repo
[ -f /opt/amble/shared/.env ] || cp /opt/amble/repo/.env.example /opt/amble/shared/.env
chmod 600 /opt/amble/shared/.env
chown -R amble:amble /opt/amble

cp /opt/amble/repo/deploy/amble.service /opt/amble/repo/deploy/amble-deploy.service /opt/amble/repo/deploy/amble-deploy.timer /etc/systemd/system/
sed "s/{{DOMAIN}}/$DOMAIN/" /opt/amble/repo/deploy/Caddyfile > /etc/caddy/Caddyfile
# Lets the deploy script restart the app, and nothing else.
echo 'amble ALL=(root) NOPASSWD: /usr/bin/systemctl restart amble' > /etc/sudoers.d/amble
chmod 440 /etc/sudoers.d/amble

systemctl daemon-reload
systemctl enable amble amble-deploy.timer
systemctl enable --now caddy
systemctl reload caddy

echo
echo "Done. Next:"
echo "  1. Fill in /opt/amble/shared/.env, including APP_BASE_URL=https://$DOMAIN"
echo "  2. systemctl start amble-deploy.timer"
echo "  3. systemctl start amble-deploy, then journalctl -u amble-deploy -f to watch the first deploy"
