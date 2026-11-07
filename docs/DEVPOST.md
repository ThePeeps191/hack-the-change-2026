# Devpost draft

A starting point for the Devpost submission. The friends and demo area owns the final version. Fill in everything in `<angle brackets>`, read it aloud once, and submit by **10:30 AM Sunday** (it closes at 11:30 sharp). Check every claim against [JUDGING.md](JUDGING.md#audit-what-a-judge-sees-today) before submitting, and don't describe anything that isn't in the deployed app.

## Checklist (any one missing fails prescreening)

- [ ] Title: `<TEAM ID> - <TEAM NAME> - Amble`
- [ ] Video between 2:00 and 5:00, public or unlisted, playing without a login
- [ ] GitHub link: https://github.com/ThePeeps191/hack-the-change-2026 (public)
- [ ] All four team members added: Danny, Siddhant, Aaron, Jonas
- [ ] The description below, including the AI disclosure
- [ ] The live link works on a phone, and the "Try the demo" button works
- [ ] The MLH prize categories ticked: Gemini API, Auth0, Tiger Data, Vultr (plus GoDaddy Registry if we registered a domain through it)

## Tagline

Twenty minutes, someone new, somewhere outside.

## Description

### Inspiration

23% of Canadians aged 15 to 24 always or often feel lonely, the highest of any age group ([Statistics Canada](https://www.statcan.gc.ca/o1/en/plus/274-you-are-not-alone)). Only 46% of Canadian adults get the recommended 150 active minutes a week ([Statistics Canada](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021c-eng.htm)). <One Calgary-specific, sourced number for Benevity's Best Local Impact, or delete this sentence.> Making a friend usually means planning a coffee and making small talk, which is exactly the hard part for newcomers, for people living alone and for anyone shy.

### What it does

Amble answers Prompt 1 through two focus areas: **Community Connection & Inclusion** and **Proactive Health & Wellness**.

Tap "I'm free" and Amble pairs you with someone nearby who's free too. You both get the same small 20-minute quest at a real, public place, such as finding the oldest book on one floor of the library, or trying a snack neither of you has had. There's something to do besides small talk. Take a photo, and an AI referee (Gemini) checks it against the quest, the place and the time. Then you see a recap of your walk, and choose whether to stay in touch. You only connect if you both say yes.

With friends, crews earn coins together and play **Claim**, a game where you take spots on the campus map by beating that spot's challenge.

The "You" tab shows numbers that matter, privately and never ranked: active minutes against Canada's 150-minute guideline, "familiar faces" (people you've done several quests with, measured against research on how many hours friendship takes), new places, and how you felt before and after.

### Inclusive and safe by design

- Comfort settings: step-free places only, short and easy pace, side by side instead of chatting, and quests in ten languages.
- You meet at a public quest spot, never at each other's location. Your partner sees a rough distance, then a first name once you both say yes.
- 18+, daylight only for meeting strangers, one tap to report, and a report means you're never paired again.
- Location is deleted the moment you're matched, routes are deleted after 30 days, and you can download or delete all your data. The privacy page says which AI sees your photos.

### How we built it

One Next.js (TypeScript) app on a **Vultr** server behind Caddy. **Auth0** handles login. Postgres on **Tiger Data** stores the data, with location pings in a TimescaleDB hypertable and a 30-day retention policy. **Gemini** writes quests at real public places taken from OpenStreetMap, with Maps and Search grounding, checks proof photos and videos, and writes recaps. Every quest the AI writes passes a safety check in code (blocked topics, distance, duration), and every AI call has a timeout and a fallback, so the app never leaves anyone stuck. There are no background workers: state moves forward when a phone polls, and every rule is enforced on the server inside database transactions. An end-to-end test drives the whole product over HTTP as a dozen simulated people.

### Challenges we ran into

<Two or three real ones, in our own words. Candidates: matching two people safely without revealing location; keeping AI quests at real, open, public places; making the demo work for a judge who's alone; dozens of AI coding sessions working in parallel without conflicts.>

### Accomplishments we're proud of

<In our own words.>

### What we learned

<In our own words.>

### What's next

A pilot on the UCalgary campus with <only name partners we actually spoke to>. Give-back and skill-swap quests with local organizations. Measuring the before-and-after mood check and the familiar-faces count across a term.

### Cost

<Measured cost per quest from the logged token counts. Leave this out rather than guess.>

## AI disclosure

We used AI in two ways, and we're disclosing both.

1. **Building the project.** We used Claude Code (Anthropic) as a coding assistant throughout, with many sessions working in parallel on separate branches that we reviewed and merged through pull requests. It wrote a large share of the code. We made the product decisions: the idea and focus areas, the safety rules, the metrics and the research behind them, the quests, the design direction and what to cut. Every team member can explain the code. <Add any other tools used, such as image generation or ChatGPT.>
2. **Inside the product.** Google Gemini writes quests near the user, checks proof photos and videos, and writes recap summaries. During development we also ran Claude Haiku (Anthropic) behind the same interface to save Gemini quota. The deployed app uses Gemini. Users are told on the privacy page which AI sees their photos.
