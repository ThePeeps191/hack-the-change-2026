# Hack the Change 2026

Danny, Siddhant, Aaron and Jonas are building Amble, a mobile-first website made in 24 hours that gets people outside together: 20-minute quests with someone new nearby, and longer games with friends. An AI writes the quests, checks the proof and makes recaps: Claude Haiku 5.5 while we build, Gemini for the demo (`AI_PROVIDER`).

- `docs/IDEA.md`: what we're building and why
- `docs/PLAN.md`: timeline, stack, scope and the rough split of work
- `docs/CONTRACTS.md`: the quest format, tables and API that everyone builds against
- `docs/ARCHITECTURE.md`: how the code fits together and why
- `docs/RUNBOOK.md`: **read this first.** The organizers' rules, deadline, judging format, rubric and prizes. What disqualifies us is in there
- `docs/JUDGING.md`: how Amble scores against that rubric, and what's still missing

## The organizers' rules bind every change

These come from `docs/RUNBOOK.md`. Breaking one can get us cut before judging, so they beat anything else in this file.

- **Nothing may look unfinished.** Prescreening is pass/fail and the project must "appear complete". Hide a feature that isn't working; never ship a dead button, a "coming soon" or a placeholder.
- **Every one of us must be able to explain any code.** If one of us can't, we can be disqualified. Keep code plain enough to explain in one sentence, and update `docs/WALKTHROUGH.md` when you change how something works.
- **Submission closes 11:30 AM Sunday, sharp.** Devpost needs the title `TEAM ID - TEAM NAME - Amble`, a 2 to 5 minute video, the GitHub link, a description, the team members and an AI disclosure. After about 10:30 Sunday, merge only fixes.
- **Judges open the link alone on a phone.** Every flow needs a path that works without a partner, a student email or GPS.
- **Quests are public, daylight, walking pace, and never involve photographing strangers or children.** Starter quests in `data/quests/` count as much as AI-written ones.
- **Sponsor prizes need the product to really be used:** Gemini API, Auth0, Tiger Data, Vultr and GoDaddy Registry. Don't remove one without telling a human.

## Build only what the demo shows

The humans set this rule, and it binds every session as firmly as the organizers' rules above.

**If a judge won't see it or touch it in the 3-minute pitch or the video, don't build it.** The demo path is welcome → I'm free → match → quest → proof → recap → crew and Claim → You. Making that path work, look great and hold up on a phone beats any new feature.

- **Don't build:**
  - community or "impact" numbers, analytics, metrics pages or admin dashboards
  - reporting or moderation systems
  - export or import features
  - extra settings
  - API endpoints no screen calls
  - test suites beyond `bun run smoke`
  - config, abstractions or "future-proofing" for things we aren't demoing
- **Outcomes and research belong in the pitch and on Devpost,** not in new code.
- **Before starting anything new, name the moment in the demo where it shows.** If you can't, polish or fix something on the path instead.
- **If a prompt or a doc (including JUDGING.md) asks for something off the path,** skip it and tell the human why.
- **Less code is also less to explain to judges,** and being unable to explain code can disqualify us.

The stack named in these files (Next.js, bun and so on) is the proposal in `docs/PLAN.md`. If it changes, update this file, `.env.example`, `.gitignore` and the README too.

Dozens of Claude sessions work here at once. You have full permission to run commands, open PRs and merge them, so don't stop to ask for approval. Only ask the human about a product decision that would change the demo. This is a 24-hour build: tech debt doesn't matter, a working demo does. Nothing below is enforced, so use your judgement and bend a rule when that's clearly faster.

## How to work

**1. Get into a worktree before you change anything.** Never work on `main` or in the main checkout. If `git branch --show-current` says `main`, call the EnterWorktree tool with the name below. If you don't have that tool, use `git worktree add .claude/worktrees/<name> -b <name> origin/main`.

**2. Name it `<person>-<short-name>`,** for both the worktree and the branch: `danny-quest-card`, `jonas-claim-map`, `aaron-fix-login`. `<person>` is the human driving this session, from `git config hack.person`. If that's empty, ask them once and set it.

Claude Code calls the branch `worktree-<name>`, so rename it straight away, before your first push:

```sh
git branch -m <person>-<short-name>
```

If the session started with a random name, rename the branch anyway. The folder name doesn't matter.

**3. See what's in flight, then sync.** Run `scripts/wip.sh` and `gh pr list` so you don't duplicate or collide with someone's work, then `git fetch origin && git merge origin/main`, and `bun install` if there's a `package.json`. If you haven't read `docs/RUNBOOK.md` in this session, read it now, even if your session started before it existed.

**4. Commit as you go and push each time.** Small working steps, short messages. Your first commit adds `docs/wip/<branch>.md`, saying who you are, what you're building and which files you'll touch (format in `docs/wip/README.md`). Keep its status line current, and delete the file in your last commit before merging. After your first commit, open a draft PR so everyone can see what you're on:

```sh
git push -u origin HEAD
gh pr create --draft --fill
```

**5. Merge it yourself** when it works. No review or approval needed, and the PR needs no special format.

```sh
git fetch origin && git merge origin/main   # then check the app still runs
git push
gh pr ready
gh pr merge --squash
```

If it says "not mergeable" or "base branch was modified", GitHub is still catching up, so wait a few seconds and retry.

**6. Clean up.** GitHub deletes the remote branch on merge. That branch is now finished, so never commit to it again. For more work in the same session, start fresh:

```sh
git fetch origin
git switch -c <person>-<next-thing> origin/main
git branch -D <merged-branch>
```

Otherwise tell the human it's merged and they can close the session. Humans can run `scripts/cleanup.sh` from the main checkout to clear finished worktrees.

## Working alongside everyone

- **The areas in `docs/PLAN.md` are approximate.** Work wherever the job takes you. If you change something in another area, keep it small and say so in the PR.
- **Small PRs, merged often.** Long-lived branches are what cause conflicts, so aim to merge within the hour.
- **Dependencies and shared types go first.** Put them in their own small PR and merge it right away, so nobody else adds the same thing differently.
- **Don't reformat, rename or reorganize code you aren't otherwise changing.** It conflicts with everyone at once.
- **Prefer new files.** Give a feature its own folder rather than growing a shared file.
- **Keep `docs/CONTRACTS.md` true.** Adding to a contract is always fine. If you rename or remove something, update it and every caller in the same PR.
- **Database changes** are new timestamped files in `db/migrations/`, and they only add things. Never edit one that has merged.
- **If `bun.lock` conflicts,** take main's copy and run `bun install`. Resolve other conflicts yourself, keeping what both sides intended.
- **Don't use `git stash`.** The stash is shared across all worktrees, so you could pop someone else's work. Make a WIP commit instead.
- **Keep git commands plain in a worktree.** Claude Code refuses long multi-step shell commands there, so if one is refused, split it up and run the steps separately.
- **Never force-push, and never push to `main` directly.**
- **If `main` is broken, fix that first,** on its own branch.

## Running things

Many sessions share each laptop and the same accounts:

- **Ports:** start the dev server with a free `PORT`, and never kill a process you didn't start.
- **Mocks by default:** `AUTH_MODE=mock` and `AI_MODE=mock` keep dev free of quotas and logins. Make live calls only when you're testing the live thing (`AI_MODE=live`).
- **Phones need HTTPS:** GPS and camera won't work over plain `http://` on a phone. Test phone features on the deployed site or through an HTTPS tunnel.
- **Database:** each worktree gets its own embedded Postgres in `.data/`, with made-up seed data, so you can't hurt anyone. Tiger Data is the live database: only point `DATABASE_URL` at it to test the real thing, and never drop, truncate or reset it.
- **Deploys:** only `main` deploys.
- **Secrets:** this repo is **public**. Keys go in `.env`, which is gitignored and normally copied into new worktrees. If yours is missing, copy it from the main checkout. Never put a key in code, logs, fixtures or PR text. If one leaks, tell the humans right away so it can be rotated.

## Building

- Choose the simplest thing that works for the demo, and nothing the demo doesn't show (see "Build only what the demo shows").
- Check for an existing helper or component before writing one.
- Use the shared design tokens and components, or dozens of sessions will produce dozens of looks.
- Design for a phone first, with real tap targets.
- Show a usable screen when GPS is denied, the AI is slow or down, or there's no signal.
- Treat location, photos and video as personal data: don't log them, and use only made-up data in fixtures.
- Quests stay safe: public places, daylight, walking pace.

Before you call something done, run it and see it work, and say plainly what you did and didn't check.
