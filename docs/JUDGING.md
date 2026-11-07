# Winning the judging

How Amble earns marks against the Hack the Change 2026 rubric, and what each area of the team has to deliver for that. [PLAN.md](PLAN.md) holds the build plan, and this file is what the build is for. The team writes the quests and the story. This file gives them a structure to hang on.

## Hard gates (prescreening, no exceptions)

If any of these is missing, nothing else matters.

- [ ] Submitted on Devpost by **11:30 AM ABT, Sunday Nov 8**. Aim for 10:30.
- [ ] Title is exactly `TEAM ID - TEAM NAME - Amble`.
- [ ] A **2 to 5 minute video** of the product working: real phones, real campus, a real quest.
- [ ] A **public GitHub link**. The repo is public, so check that no key has ever been committed.
- [ ] **AI use disclosed on Devpost.** Not disclosing it can mean disqualification and a report to MLH.
- [ ] **Everyone can explain the code.** An inability to explain any technical design or code can mean disqualification, and all members must attend judging in person. Read [ARCHITECTURE.md](ARCHITECTURE.md) before judging.
- [ ] It runs as intended for anyone with the link. Have a demo login and a bot partner for judges who are alone (see Demo in PLAN.md).
- [ ] It looks complete: every tab works, with no "coming soon" and no dead buttons. Anything unfinished gets hidden, not shown broken.
- [ ] Prescreening also needs us at least *satisfactory* in **Idea** (innovation, impact) and **Effectiveness** (it works and is usable).

Pass/fail checks: theme, functionality, innovation, completeness, technical feasibility, presentation. "Purely vibecoded" projects get cut, so the work has to show decisions a human made: the quests, the story, the metrics and why they were chosen.

## Prompt fit: which focus areas we answer

The objective asks for a working prototype that addresses **at least one focus area** under the chosen prompt. We're **Prompt 1**, and we claim two areas. Say both by name in the video, on Devpost and in the first 20 seconds of the pitch.

**Focus area 1, Community Connection & Inclusion** ("reduce loneliness for vulnerable populations, e.g. seniors, newcomers, marginalized groups" and "encourage neighbourhood engagement, such as volunteering, skill-sharing and community building"):

- **Who it's for, named:** newcomers (international students and people new to Calgary, who have no network yet), people living alone (including older adults on daytime walks), and anyone who finds it hard to start a conversation. 20 minutes with a task is lower pressure than "let's grab coffee".
- **Newcomer quests:** practical, welcoming tasks that double as orientation, such as getting a library card at the Central Library, finding the free campus food pantry, trying a Calgary staple, or riding the C-Train one stop to a park. Gemini can **translate quest text** into the player's language, so the app works before your English does.
- **Give-back quests (volunteering):** 20-minute micro-volunteering, such as a litter pick in a park, sorting at a community fridge or food bank drop-off, or returning carts at a library. Gemini's Search grounding finds real volunteer events today. A give-back quest earns the crew coins like any other.
- **Skill-swap quests:** "teach each other one thing in 20 minutes" (a phrase in your language, a chess opening, a stretch). This is the skill-sharing the prompt names, and it gives strangers something to do other than small talk.
- **Comfort settings, so it's inclusive:** pace and access (step-free, seated or short distance), social energy ("chatty" vs "side-by-side": quests you can do together without much talking), daytime-only, and language. Matching and quest generation respect them.

**Focus area 2, Proactive Health & Wellness** ("support mental, physical or holistic well-being through habit tracking, mindfulness, or preventative care"):

- **Habit, not streaks:** weekly active minutes against the 150-minute guideline (prevention, not punishment), shown as a gentle weekly trail rather than a streak you can break.
- **Mindfulness built into the loop:** a one-tap check-in before and after each quest ("how are you, honestly?"). It takes a breath to answer, and over time it shows the user their own pattern ("you usually feel better after"). The optional monthly UCLA 3-item loneliness check closes the loop.
- **Stress:** "calm" quests designed for decompression, such as a 20-minute phone-down walk to a view or noticing three things you can hear. Tagged so a stressed user can ask for one.

**What this means for the contract:** quests get an optional `tags` field (`newcomer`, `give-back`, `skill-swap`, `calm`, `step-free`, `side-by-side`, `daytime`) and users get optional `prefs` (pace, social energy, language). Both are additive. Gemini area: generate and tag these. UI area: comfort settings in onboarding and the profile, tag chips on quest cards, and the check-in. Friends and demo: write the newcomer, give-back and skill-swap starter quests for campus.

**Out of scope, on purpose:** areas 1.3 (telehealth, medical data) and Prompt 2. Don't drift into them in the pitch.

## The rubric, one row at a time

Each category is scored 1 to 5. The bullets are what a 5 looks like for us.

### Innovation & Creativity

*5 = "stands out as highly original or a transformative rethinking; technology applied in a creative and well-justified way."*

- **No-setup game master.** Gemini writes quests for whatever is open and happening near you right now (Maps and Search grounding). City-game apps need a human to design every map. Show a quest being generated for the room the judges are standing in.
- **AI referee with context.** Proof is checked against the quest, the place and the time window, not just "is there a book in this photo".
- **We measure friendship, not followers.** The metrics below come from research on how friendships actually form. No other fitness or social app counts this.
- **Strangers become regulars.** The second time you're matched with someone, the app notices, and that's where the loneliness numbers actually move.
- **Claim mode** turns a campus into a board game that crews play over days.

### Impact & Relevance to the prompt (health, social connection, well-being)

*5 = "embodies the prompt; significant, measurable, scalable impact."*

- **The problem, with numbers:** 23% of Canadians aged 15 to 24 feel lonely always or often, and only 46% of adults get 150 active minutes a week (sources in IDEA.md).
- **Measurable outcomes in the product itself** (see Metrics): active minutes against the national guideline, time spent with the same people, new places, and mood before and after. A judge can see impact for a single user on the dashboard.
- **Inclusive by design, for named groups:** newcomers, people living alone and anyone shy (see Prompt fit). Comfort settings (pace and access, side-by-side vs chatty, language), walking pace with no fitness level assumed, any phone browser with no install, free, low-pressure copy, and "anywhere" quests for people who can't get to campus.
- **Neighbourhood engagement:** give-back (volunteering) and skill-swap quests turn a 20-minute gap into community work.
- **Safe by design:** 18+, both people say yes, you meet at a public quest spot (never at each other's location), daylight quests, a report button that is always one tap away, and only a first name until both accept.
- **Community and city:** quests send people to public libraries, campus events and local spots, on foot. That's sustainable mobility, and footfall for public spaces.

### Feasibility & Scalability

*5 = "highly executable within real-world limits; clear plan for budget, infrastructure and adoption."*

- **Cold start:** launch on one campus, where there's density, a shared schedule and free time between classes. Crews and invite links work even with zero strangers nearby. That's the pilot.
- **Cost:** one Gemini call writes a batch of quests, which are cached per area and reused. The starter pack is the free fallback. Put a per-quest cost estimate in the Devpost from actual token counts (measure it, don't guess).
- **Infrastructure:** one Next.js app, Postgres on Tiger Data (location pings as a hypertable), Auth0. It scales to another city by changing the location and nothing else.
- **Adoption partners to name:** the campus wellness centre, the students' union, residence life and city parks and recreation. Only name a partner as confirmed if we really spoke to them.
- **Risks we've thought about:** safety (above), GPS spoofing (proof checks location and time), Gemini being wrong (manual approval in demo mode, appeals), and battery (location pings only during a quest).

### Technical Execution

*5 = "strong technical depth and reliability; stack chosen and implemented with precision."*

- Shared contracts (`src/lib/contracts.ts`) with mock and live modes for auth and Gemini, so the demo never depends on luck.
- Gemini grounding with sources shown, as Google requires. Structured output with a safety check on what comes back.
- Proof verification uses media plus GPS plus timestamp.
- Ratings use Glicko-2 from a library, not hand-rolled maths.
- It degrades gracefully: GPS denied, no signal and Gemini down each have a designed state (tested, not just claimed).

### User Experience & Design

*5 = "seamless, engaging, universally accessible; visually striking yet purposeful."*

- One design system: tokens, components, light and dark themes, and Pip the mascot reacting to every state.
- Built for one hand outdoors: 44 px+ targets, primary actions in the thumb zone, contrast that holds up in sunlight, reduced-motion support.
- Low-pressure by design: the timer is gentle, you can always leave, there's no streak guilt, and nothing yells.

## Metrics that are human, not dashboard filler

"People met this week" is a vanity count. These are the ones we show, each with the reason it matters. The dashboard leads with them, and coins and ratings come second.

| Metric | What it is | Why it's the right one |
| --- | --- | --- |
| **Time outside, active** | Minutes walking during quests this week, against **150 min**, the Canadian 24-Hour Movement Guidelines target | It's the exact gap in the IDEA stats (46% meet it). It's a guideline, not a streak |
| **Familiar faces** | People you've done 2+ quests with, and the hours you've spent together | Friendship comes from repeated time together. Hall (2019) estimates about 50 hours to go from acquaintance to casual friend, and about 90 to friend. We show progress towards that, not a follower count |
| **Small hellos** | Quests with someone new, shown as moments ("found the oldest book with Priya"), not a tally | Brief contact with weak ties measurably lifts mood (Sandstrom & Dunn, 2014). The point is the moment, not the count |
| **New places** | Places you'd never been before, on your map | More varied daily movement is linked with more positive mood (Heller et al., 2020) |
| **How you felt** | An optional one-tap mood before and after a quest, plus an optional monthly 3-question loneliness check (the UCLA 3-item scale) | This is how we show impact honestly, for one person and over time, without inventing numbers |

Rules: everything is private by default, nobody is ranked on wellbeing, and there are no streaks that punish you for a quiet week. Verify each citation before quoting it on Devpost.

## Ratings, coins and stats

There are three layers, so the competitive parts never leak into stranger meetups.

1. **Wellbeing stats** (above). They come from every quest, private, never ranked.
2. **Coins.** Every completed quest earns coins for effort, and coins feed the weekly crew leaderboard. Anyone can earn them at any fitness level.
3. **Ratings (Glicko-2, using the `glicko2` package).** Only where there's a real winner: crew vs crew in Claim (claiming or stealing a zone is a result) and races, plus friend 1v1 challenges. They're kept per category (fitness, explore, social) so everyone competes at their own level. Stranger quests are cooperative and never touch a rating.

## The 3-minute demo (round 1) and 5-minute final

The team owns the story. This is the skeleton it has to fit.

1. **Hook (20 s):** one real moment (a newcomer's first week works well), then the loneliness and activity numbers, and say the two focus areas by name.
2. **System 1 live (90 s):** on a phone: free for 20 min, matched (bot partner if needed), a UCalgary quest, a photo, Gemini confirms it, the recap.
3. **Why it works (30 s):** the human metrics on the dashboard, and safety in one sentence.
4. **System 2 (30 s):** crew leaderboard, the Claim map, a zone stolen.
5. **Close (10 s):** what a pilot on campus looks like.

The final adds 2 minutes: scalability (cost, any city), the tech architecture, and what we'd measure in a pilot.

**Q&A to rehearse:** "How do you stop creeps?" "What if nobody's nearby?" "Can't people fake photos?" "How much does Gemini cost per user?" "Why would someone open this twice?" "How is this different from Meetup or Bumble BFF?"

## Who covers what

| Area | Owns for judging |
| --- | --- |
| UI/UX and metrics | Design system, every screen, the human metrics dashboard, ratings, the screenshots in the video |
| Backend | Login and the demo login, matching, the live deploy, no secrets in the repo |
| Gemini | Grounded quests with sources, the proof referee, recaps, the cost-per-quest number |
| Friends and demo | Quests and story, Claim rules, testers, the video, the Devpost write-up, the title format, submitting early |
