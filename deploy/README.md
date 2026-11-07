# Deploying

One Vultr server runs the app behind Caddy, which handles HTTPS. Nothing in GitHub needs setting up: the repo is public, so the server just checks `main` every minute and builds new commits in their own folder. It only switches over if the build and migrations pass, and it rolls back if the new version doesn't answer `/api/health` within a minute. A broken merge leaves the last good version live.

## First time

You need an Ubuntu server with about 4 GB of RAM (Next.js builds can run out of memory on less), and a DNS A record pointing your domain at it.

1. SSH in as root and run:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/ThePeeps191/hack-the-change-2026/main/deploy/setup.sh | DOMAIN=your.domain bash
   ```

2. Fill in `/opt/amble/shared/.env`. See `.env.example` for the names.
3. Start it:

   ```sh
   systemctl start amble-deploy.timer
   systemctl start amble-deploy
   ```

## No domain yet?

Use `DOMAIN=<server-ip>.sslip.io`. That address resolves to your server straight away, and Caddy can still get a real HTTPS certificate for it, so phones work before DNS is ready.

## Day to day

| To | Run |
| --- | --- |
| Watch deploys | `journalctl -u amble-deploy -f` |
| Watch the app | `journalctl -u amble -f` |
| See what's live | `cat /opt/amble/deployed`, or `https://your.domain/api/health` |
| Retry a failed commit | `rm /opt/amble/failed` |
| Roll back | `ln -sfn /opt/amble/releases/<sha> /opt/amble/current`, then `systemctl restart amble` |

## What's where

Secrets are in `/opt/amble/shared/.env` and proof media is in `/opt/amble/shared/uploads`, outside the release folders, so deploys never touch them. Without a `DATABASE_URL` the site uses embedded Postgres in `/opt/amble/shared/pglite`, so it can go live before Tiger Data is set up. Data there doesn't move to Tiger Data later.

With `DATABASE_URL` set, each deploy runs the migrations. If `DEMO_MODE` is set too, it also adds the demo crews and history, which is safe to repeat.

## For the demo

`AUTH_MODE=live AI_MODE=live DEMO_MODE=1` gives real Auth0 and real AI, plus a "try the demo" button, the bot partner, and no daylight or location rules. Turn `DEMO_MODE` off for real use, because it also lets anyone in without a student email.

### Swapping to Gemini before the demo

Put `AI_PROVIDER=gemini` and `GEMINI_API_KEY=...` in `/opt/amble/shared/.env`, then run `systemctl restart amble`. Check `https://your.domain/api/health` says `"ai_provider":"gemini"`. Swap back with `AI_PROVIDER=claude`. The provider is read at startup, so it needs the restart; keys are re-read whenever `.env` changes.
