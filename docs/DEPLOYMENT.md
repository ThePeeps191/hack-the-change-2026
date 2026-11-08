# Deployment: what's live and how it's wired

The live app is **https://amble.health**. This page lists every outside service we've set up, so nobody sets one up twice or breaks one. No secrets here: this repo is public. Values live in Vercel; ask Danny for access.

## The services

| What | Where | Details |
| --- | --- | --- |
| Hosting | **Vercel**, project `amble` (team `thepeeps191s-projects`, Hobby) | Builds every push to `main` and nothing else (`vercel.json`). Also reachable at `amble-three.vercel.app`, but Auth0 sign-in only works on amble.health |
| Domain | **amble.health**, bought by a friend, DNS at **Porkbun** | `A @ 216.198.79.1` and `CNAME www` to Vercel. `www` forwards to the bare domain. HTTPS is Vercel's. Not a GoDaddy Registry domain |
| Database | **Tiger Data** (Tiger Cloud), service `amble` | Postgres with TimescaleDB, AWS `us-east-1` (next to Vercel), 0.5 CPU, development tier, paid by trial credits (about 30 days from Nov 7). `location_pings` is a hypertable with 30-day retention |
| Login | **Auth0**, tenant `dev-nvabg6b64ww053zt` (US), Regular Web App `Amble` | Callback `https://amble.health/auth/callback`, logout and web origin `https://amble.health`, plus `localhost:3000` for local tests. Email/password and Google are on |
| AI | **Claude Haiku 5.5** on Danny's Anthropic key now; **Gemini** for the demo | Swap: add `GEMINI_API_KEY` and set `AI_PROVIDER=gemini` in Vercel, then redeploy. Only Gemini watches video proof; on Claude, video is checked by place and time only |

## Environment variables in Vercel (Production)

| Name | Value | Notes |
| --- | --- | --- |
| `AUTH_MODE` | `live` | Auth0 login |
| `AI_MODE` | `live` | Real AI calls |
| `DEMO_MODE` | `1` | "Try the demo" login and the Priya bot, so judges get in alone |
| `DATABASE_URL` | Tiger connection string (secret) | |
| `ANTHROPIC_API_KEY` | secret | |
| `AUTH0_DOMAIN` | `dev-nvabg6b64ww053zt.us.auth0.com` | |
| `AUTH0_CLIENT_ID` | the Amble app's client ID | |
| `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` | secret | |
| `APP_BASE_URL` | `https://amble.health` | Must match the Auth0 URLs |
| `PGLITE_DIR` | `/tmp/pglite/db` | Leftover from before Tiger; ignored while `DATABASE_URL` is set |
| `AI_PROVIDER`, `GEMINI_API_KEY` | not set yet | For the Gemini swap |

Changing a variable does nothing until a redeploy (Vercel → Deployments → Redeploy, which asks for Danny's 2FA), or until the next merge to `main`.

## How a deploy works

1. A merge to `main` triggers a Vercel build. Other branches are skipped.
2. The production build runs `scripts/db-migrate.ts` on Tiger first: new files in `db/migrations/`, the starter quests from `data/quests/`, and the demo seed (because `DEMO_MODE=1`). Then `next build`.
3. Proof photos and videos are stored in Postgres (`uploads` table), because Vercel functions have no lasting disk. Vercel refuses uploads over 4.5 MB, so the phone shrinks photos first (`src/lib/shrink-photo.ts`) and clips must be short.

So a migration merged to `main` runs on the live database within minutes. Migrations only add things (see CLAUDE.md).

## Rules for the live site

- **Don't point your local `DATABASE_URL` at Tiger,** and don't run `bun run smoke` against amble.health. It creates dozens of test users and crews where judges would see them. Use mock mode locally.
- **To check the live site,** use `/api/health` (it shows the login mode, AI mode and provider, which keys are present, and the database kind) and the "Try the demo" button. Delete any test account you make (`DELETE /api/me`, or the button on `/privacy`).
- **Never paste a secret** into code, docs, PR text or chat. If one leaks, tell Danny so it can be rotated.
