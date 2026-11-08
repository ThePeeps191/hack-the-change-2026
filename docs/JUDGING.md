# Winning the judging

How Amble earns marks against the Hack the Change 2026 rubric, and what each area of the team has to deliver for that. [PLAN.md](PLAN.md) holds the build plan, and this file is what the build is for. The team writes the quests and the story. This file gives them a structure to hang on.

The organizers' rules, word for word where it matters, are in [RUNBOOK.md](RUNBOOK.md). How to explain every part of the code is in [WALKTHROUGH.md](WALKTHROUGH.md). The latest judge's-eye audit, with what's still open, is [at the end of this file](#audit-what-a-judge-sees-today).

## Hard gates (prescreening, no exceptions)

If any of these is missing, nothing else matters.

- [ ] Submitted on Devpost by **11:30 AM ABT, Sunday Nov 8**. Aim for 10:30.
- [ ] Title is exactly `TEAM ID - TEAM NAME - Amble`.
- [ ] A **2 to 5 minute video** of the product working: real phones, real campus, a real quest. Under 2:00 or over 5:00 fails prescreening.
- [ ] A **project description** and **all team members** added on Devpost. A draft description and AI disclosure are in [DEVPOST.md](DEVPOST.md).
- [ ] A **public GitHub link**. The repo is public, so check that no key has ever been committed.
- [ ] **AI use disclosed on Devpost.** Not disclosing it can mean disqualification and a report to MLH.
- [ ] **Everyone can explain the code.** An inability to explain any technical design or code can mean disqualification, and all members must attend judging in person. Each of us reads [WALKTHROUGH.md](WALKTHROUGH.md) and can answer its questions without looking.
- [ ] It runs as intended for anyone with the link. Have a demo login and a bot partner for judges who are alone (see Demo in PLAN.md).
- [ ] It looks complete: every tab works, with no "coming soon" and no dead buttons. Anything unfinished gets hidden, not shown broken.
- [ ] Prescreening also needs us at least *satisfactory* (3 out of 5) in **Idea** and **Effectiveness**. The rubric has no rows with those names, so treat Idea as Innovation plus Impact and Effectiveness as Technical Execution plus UX, and be a clear 3 or better on all five.
- [ ] **It's deployed.** Prescreeners and judges will open the link. A localhost demo can't pass "can be executed or run as intended".

Pass/fail checks, each one a hard fail: **adherence to theme** (fits the prompt and the challenge statement), **functionality** (runs as intended), **innovation** (a creative approach), **completeness** (code, presentation *and* demo all there), **technical feasibility** (appropriate use of technology), **presentation** (goals and outcomes explained clearly). "Purely vibecoded" projects get cut, so the work has to show decisions a human made: the quests, the story, the metrics and why they were chosen.

## How the live rounds work

- **Rounds 1 and 2 are two different panels** of 3 or 4 judges, back to back. Each judge scores on their own and the scores are averaged. Give the same pitch twice: neither panel has seen it.
- **3 minutes to present, then 2 minutes of Q&A.** A CTC member times it and **cuts us off at 3:00**, so rehearse to 2:45. Have the phone already on the home screen, logged in, before the clock starts.
- **Finals:** the top teams present to all judges, **5 minutes plus 3 minutes of Q&A**, with the same hard cutoff. Each judge's 1st, 2nd and 3rd earn 3, 2 and 1 points, and the most points wins. **Ties go to the Round 1 rubric score**, so Round 1 counts twice: it gets us into the final and it breaks the tie.
- All four of us stand at the table for every round. Anyone can be asked about any file.

## Prompt fit: which focus areas we answer

The objective asks for a working prototype that addresses **at least one focus area** under the chosen prompt. We're **Prompt 1**, and we claim two areas. Say both by name in the video, on Devpost and in the first 20 seconds of the pitch.

**Focus area 1, Community Connection & Inclusion** ("reduce loneliness for vulnerable populations, e.g. seniors, newcomers, marginalized groups" and "encourage neighbourhood engagement, such as volunteering, skill-sharing and community building"):

- **Who it's for, named:** newcomers (international students and people new to Calgary, who have no network yet), people living alone (including older adults on daytime walks), and anyone who finds it hard to start a conversation. 20 minutes with a task is lower pressure than "let's grab coffee".
- **Newcomer quests:** practical, welcoming tasks that double as orientation, such as getting a library card at the Central Library, finding the free campus food pantry, trying a Calgary staple, or riding the C-Train one stop to a park.
- **Give-back quests (volunteering):** 20-minute micro-volunteering, such as a litter pick in a park, sorting at a community fridge or food bank drop-off, or returning carts at a library. A give-back quest would earn the crew coins like any other. *Not in the quest pack (decided Nov 7, audit item 4), so don't claim it in the pitch.*
- **Skill-swap quests:** "teach each other one thing in 20 minutes" (a phrase in your language, a chess opening, a stretch). This is the skill-sharing the prompt names, and it gives strangers something to do other than small talk. *Not in the quest pack (decided Nov 7, audit item 4), so don't claim it in the pitch.*
- **Comfort settings, so it's inclusive:** step-free, a short and easy pace, and social energy ("chatty" vs "side-by-side": quests you can do together without much talking). Matching prefers quests that fit them.

**Focus area 2, Proactive Health & Wellness** ("support mental, physical or holistic well-being through habit tracking, mindfulness, or preventative care"):

- **Habit, not streaks:** weekly active minutes against the 150-minute guideline (prevention, not punishment), shown as a gentle weekly trail rather than a streak you can break.
- **Mindfulness built into the loop:** a one-tap check-in before and after each quest ("how are you, honestly?"). It takes a breath to answer, and over time it shows the user their own pattern ("you usually feel better after"). The optional monthly UCLA 3-item loneliness check closes the loop.
- **Stress:** "calm" quests designed for decompression, such as a 20-minute phone-down walk to a view or noticing three things you can hear. Tagged so a stressed user can ask for one.

**What this means for the contract:** quests get an optional `tags` field (`newcomer`, `give-back`, `skill-swap`, `calm`, `step-free`, `side-by-side`, `daytime`) and users get optional `prefs` (pace, social energy, step-free). Both are additive. Quests are hand-made and tagged in `data/quests/quests.json`. UI area: comfort settings in onboarding and the profile, tag chips on quest cards, and the check-in. Friends and demo: write the newcomer, give-back and skill-swap starter quests for campus.

**Out of scope, on purpose:** areas 1.3 (telehealth, medical data) and Prompt 2. Don't drift into them in the pitch.

## The rubric, one row at a time

Each category is scored 1 to 5, and the full wording of every level is in [RUNBOOK.md](RUNBOOK.md). The bullets are what a 5 looks like for us.

**Read the rubric literally.** It was written for cities: Innovation asks how we "creatively apply technology to urban challenges (housing, mobility, disaster resilience, inclusivity)", and a 5 in Impact "addresses inclusivity, safety, resilience and sustainability in a unified way". Say all four words in the pitch, with one Amble example each:

- **Inclusive:** comfort settings (step-free, short pace, side by side instead of chatting), free, any phone browser, no fitness level assumed, and starter quests tagged `newcomer` that double as a tour of Calgary.
- **Safe:** both people say yes, you meet at a public quest spot, your partner never sees your location, daylight only for strangers with a real account (off in demo mode so judges can try it any time), one tap to report, and a report means you're never paired again.
- **Resilient:** neighbours who already know each other, which is what a community leans on when something goes wrong. And the app itself keeps working when the AI, GPS or signal doesn't.
- **Sustainable:** every quest is on foot to a public place, with nothing to buy and no car. One AI call is shared by everyone nearby, so it stays cheap to run.

### Innovation & Creativity

*5 = "stands out as highly original or a transformative rethinking; technology applied in a creative and well-justified way."*

- **Hand-made quests at real Calgary places, with an AI referee.** We wrote every quest ourselves, so each one is safe and fun on purpose. Claude checks the proof against the quest, the place and the time.
- **AI referee with context.** Proof is checked against the quest, the place and the time window, not just "is there a book in this photo".
- **We measure friendship, not followers.** The metrics below come from research on how friendships actually form. No other fitness or social app counts this.
- **Strangers become regulars.** The second time you're matched with someone, the app notices, and that's where the loneliness numbers actually move.
- **Claim mode** turns a campus into a board game that crews play over days.

### Impact & Relevance to the prompt (health, social connection, well-being)

*5 = "embodies the prompt; significant, measurable, scalable impact."*

- **The problem, with numbers:** in Calgary, 15% of people often or always feel lonely and 26% of 18 to 34 year olds do (City of Calgary, 2025). Nationally, 23% of Canadians aged 15 to 24 feel lonely always or often, and only 46% of adults get 150 active minutes a week (sources in IDEA.md).
- **Measurable outcomes in the product itself** (see Metrics): active minutes against the national guideline, time spent with the same people, new places, and mood before and after. A judge can see impact for a single user on the dashboard.
- **Inclusive by design, for named groups:** newcomers, people living alone and anyone shy (see Prompt fit). Comfort settings (step-free, short pace, side-by-side vs chatty), walking pace with no fitness level assumed, any phone browser with no install, free, and low-pressure copy.
- **Neighbourhood engagement:** crews and Claim get friends out across campus together, and familiar faces turn strangers into neighbours. (Give-back and skill-swap quests aren't in the pack, so don't promise them.)
- **Safe by design:** both people say yes, you meet at a public quest spot (never at each other's location), daylight quests for real accounts, a report button that is always one tap away, and only a first name until both accept.
- **Community and city:** quests send people to public libraries, campus events and local spots, on foot. That's sustainable mobility, and footfall for public spaces.

### Feasibility & Scalability

*5 = "highly executable within real-world limits; clear plan for budget, infrastructure and adoption."*

- **Cold start:** launch on one campus, where there's density, a shared schedule and free time between classes. Crews and invite links work even with zero strangers nearby. That's the pilot.
- **Cost:** one AI call writes a batch of quests, which are cached per area and reused. The starter pack is the free fallback. Put a per-quest cost estimate in the Devpost from actual token counts (measure it, don't guess).
- **Infrastructure:** one Next.js app, Postgres on Tiger Data (location pings as a hypertable), Auth0. It scales to another city by changing the location and nothing else.
- **Adoption partners to name:** the campus wellness centre, the students' union, residence life and city parks and recreation. Only name a partner as confirmed if we really spoke to them.
- **Risks we've thought about:** safety (above), GPS spoofing (proof checks location and time), the AI being wrong (manual approval in demo mode, appeals), and battery (location pings only during a quest).

### Technical Execution

*5 = "strong technical depth and reliability; stack chosen and implemented with precision."*

- Shared contracts (`src/lib/contracts.ts`) with mock and live modes for auth and the AI, so the demo never depends on luck.
- Quests are hand-made in `data/quests/`, so none can send anyone somewhere unsafe.
- Proof verification uses media plus GPS plus timestamp. (The GPS and time checks are switched off in `DEMO_MODE`, so judges can try it from the room. Say so if asked.)
- Ratings use Glicko-2 from a library, not hand-rolled maths.
- It degrades gracefully: GPS denied, no signal and the AI down each have a designed state (tested, not just claimed).

### User Experience & Design

*5 = "seamless, engaging, universally accessible; visually striking yet purposeful."*

- One design system: tokens, components, light and dark themes. (There's no mascot in the build, so don't promise one.)
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
3. **Ratings (Glicko-2, using the `glicko2` package).** Only where there's a real winner. In the build that's one thing: a crew stealing a Claim zone from another crew (`rateSteal` in `src/server/games.ts`). Each crew has one rating. Stranger quests are cooperative and never touch a rating. (Races, 1v1 challenges and ratings per category were ideas that weren't built, so don't mention them.)

## The 3-minute demo (round 1) and 5-minute final

The team owns the story. This is the skeleton it has to fit.

1. **Hook (20 s):** one real moment (a newcomer's first week works well), then the loneliness and activity numbers (lead with Calgary's: 26% of 18 to 34 year olds here often or always feel lonely), and say the two focus areas by name.
2. **System 1 live (90 s):** on a phone: free for 20 min, matched (with Priya, the demo partner, and say she's a demo partner), a UCalgary quest, a photo, the AI referee confirms it, the recap.
3. **Why it works (30 s):** the human metrics on the dashboard, and safety in one sentence.
4. **System 2 (30 s):** crew leaderboard, the Claim map, a zone stolen.
5. **Close (10 s):** what a pilot on campus looks like.

The final adds 2 minutes: scalability (cost, any city), the tech architecture, and what we'd measure in a pilot.

**Q&A to rehearse:** the likely questions, with answers grounded in the code, are in [WALKTHROUGH.md](WALKTHROUGH.md#questions-judges-will-ask). Two minutes is about four answers, so keep each one to two sentences.

## Who covers what

| Area | Owns for judging |
| --- | --- |
| UI/UX and metrics | Design system, every screen, the human metrics dashboard, ratings, the screenshots in the video |
| Backend | Login and the demo login, matching, the live deploy, no secrets in the repo |
| AI | The proof referee, recaps, the cost-per-check number |
| Friends and demo | Quests and story, Claim rules, testers, the video, the Devpost write-up, the title format, submitting early |

## Side pots and sponsor prizes

Every team is entered for every side pot automatically, and each one is scored out of 3. One sentence in the pitch and a paragraph on Devpost is usually what decides them.

| Prize | What scores 3 | Our case | Go for it? |
| --- | --- | --- | --- |
| **Clio, Best in Accessibility** ($100) | Inclusive, intuitive design, plus strong privacy, security and transparency | Comfort settings, step-free quests first, AA contrast. Location is deleted the moment you're matched, a partner only ever sees a rough distance, a first name only after both say yes, media served only to people on that quest, and download or delete all your data from `/privacy`, which also says which AI sees your photos. Priya is labelled as a practice partner | **Yes.** Show `/privacy` for 5 seconds in the pitch |
| **Benevity, Best Local Impact** ($100 + $100 to donate) | A significant **Calgary** challenge, with a feasible solution that lasts | Quests at real Calgary places (the +15, Chinatown, Central Library, Prince's Island), newcomer quests that work as a city orientation, and a pilot on the UCalgary campus | **Yes**, but it needs one sourced Calgary number about loneliness or newcomers. Don't make one up |
| **Voltex, Real-World Energy Data** ($500) | Real published or measured energy data, such as AESO, central to the product, live preferred. Sample or AI-made data scores 1 | Nothing. See below | **No** |
| **MLH Gemini API** | Gemini actually used | `src/lib/gemini-live.ts` exists, but we chose Claude for the demo | **No.** Don't tick it |
| **MLH Auth0** | Auth0 login | `AUTH_MODE=live` with `src/proxy.ts` and `src/lib/auth0.ts` | **Yes**, live on amble.health |
| **MLH Tiger Data** | Tiger Data used | `DATABASE_URL` on Tiger, `location_pings` hypertable with 30-day retention, and `time_bucket` queries for the You tab's week (`src/server/week.ts`) | **Yes**, live on amble.health |
| **MLH Vultr** | Hosted on Vultr | Nothing: we host on Vercel | **No** (Danny's call) |
| **MLH GoDaddy Registry** | A domain registered through GoDaddy Registry | amble.health: `.health` is run by GoDaddy Registry (IANA, checked Nov 7) | **Yes**, opted in on Devpost |

**Why we're skipping Voltex.** Amble asks people to walk to a public place together. No decision anyone makes in the app depends on electricity prices or grid load, and the honest-sounding hooks don't hold up. "CO₂ saved by walking" would be invented, because a quest doesn't replace a car trip. "Go outside when the grid peaks" isn't something anyone needs Amble to tell them. AESO data would be a basic display at best, which the Voltex rubric scores 2, and it would cost us credibility in the main rounds. Don't add it.

## Audit: what a judge sees today

Done on Nov 7 by opening the app alone at phone width (390 × 844), with a production build and `DEMO_MODE=1`, mock login and mock AI, going through every tab and then trying to break it. The site isn't deployed yet, so live Auth0, live AI and a real phone over HTTPS weren't tested.

**What already works well.** The whole System 1 flow runs end to end alone, with the GPS denied: free, matched, quest, photo, verdict, recap. Every tab loads with no errors. Bad invite and crew codes, missing quests and a dropped signal all show a friendly message. `bun run smoke` passes 86 of 86 checks. axe finds no WCAG A or AA problems on `/crew`, `/privacy`, `/welcome` or `/login`.

**Fixed in this pass:**

| Gap | Why it cost points | Fix |
| --- | --- | --- |
| The first card on the home screen was "God Damn Dam", and "Animal Bingo" asked you to photograph a crying child | Presentation, plus a safety and privacy failure in front of the Clio judges. Our own AI rules ban filming strangers | Retitled, swapped the child for "an animal eating", fixed typos |
| "Nearby" listed quests 9 km away first | It looks broken: a "20 min" quest at the zoo | Sorted nearest first, from your location if you've already allowed it, otherwise from campus |
| No starter quest had tags | Step-free and side-by-side settings changed nothing when the AI was mocked or slow, and the pitch's newcomer quests didn't exist | Tagged 7 quests where the tag is plainly true |
| Priya, the bot, was shown as "someone's free nearby, 260 m away" | Transparency, which is half of Clio. A judge who finds out stops trusting the rest | `Match.demo_partner`, and the label from #26 |
| Faint text was 3.2:1, and the segmented tabs 2.5:1 | Fails WCAG AA, which matters for Clio and UX | Faint ink is now 4.8:1 in light mode and 5.1:1 in dark. #26 fixed the tabs |
| An unknown URL showed Next's bare 404 | "Appears complete" | A 404 page in our own style |

**Still open, ranked by points per hour of work.** Take one, and strike it out here when it's merged.

1. ~~Deploy it~~ Done: live at https://amble.health with Auth0, Tiger Data and live AI (`docs/DEPLOYMENT.md`). **Still to do:** test on a real iPhone and Android over HTTPS: GPS, the camera upload, Auth0 sign-in and "Try the demo".
2. ~~**Make sure the deployed server really runs Gemini.**~~ Decided Nov 7: the demo runs Claude. Set `AI_PROVIDER=claude` in Vercel so a stray Gemini key can't switch it. Video proof is judged from three still frames.
3. **Submit to Devpost by 10:30 Sunday** (friends and demo, about 2 h, mostly the video). Video between 2:00 and 5:00, title `TEAM ID - TEAM NAME - Amble`, all four members, and the description and AI disclosure from [DEVPOST.md](DEVPOST.md).
4. ~~**Write give-back and skill-swap starter quests on campus (#389).**~~ Decided Nov 7 not to do this, so don't pick it up: no new give-back, skill-swap or `newcomer` quests, and the quest pack in `data/quests/quests.json` stays as it is (same call as item 15). The issue is closed as not planned. Original note: Focus area 1 names "volunteering, skill-sharing", and the pack has no quests for either.
5. **Rehearse to 2:45 with a timer, twice, all four of us** (1 h). Then each person answers three random questions from [WALKTHROUGH.md](WALKTHROUGH.md) without notes. This is the disqualification risk.
6. ~~**Rewrite or remove two starter quests.**~~ Decided Nov 7 to keep safety rules light, so both stay. Original note: "Film an Air Ambulance" means filming a hospital helipad, which is a privacy flag. "Downtown View" sends people onto a parkade roof, and our own AI rules ban rooftops and heights. It's now the second card on the home screen, so do this one first.
7. **Most of the starter pack is out of reach** (friends and demo, 30 min). Since commit 0763c7f the pack is 17 Calgary quests, and only 3 are within a kilometre of campus (foosball at Schulich, the Art Parkade roof and running backwards at Foothills). The rest are 4 to 10 km away but still say "20 min", and the search screen even shows "Quests waiting at Glenmore Dam, Calgary Zoo". Add 4 to 6 more campus quests, and give the downtown ones honest durations or make them crew quests.
8. **There are no "anywhere" quests any more.** Decided: drop the promise from the pitch. Every quest is hand-made at a real place, and the README and Devpost don't mention anywhere quests. (`bun run smoke` no longer depends on them, and passes 86 of 86 on real Postgres too.)
9. **Done (#366): one sourced Calgary number for Benevity.** 15% of Calgarians often or always feel lonely, 31% sometimes, and 26% of 18 to 34 year olds often or always ([City of Calgary, Mental Health of Calgarians survey, 2025](https://www.calgary.ca/content/dam/www/programs-services/social-programs-and-services/mental-health-and-addiction-strategy/mental-health-calgarians-final-report-2025.pdf), pages 53 and 54). It's in the README, DEVPOST.md, IDEA.md and the hook above. Paste the DEVPOST.md Inspiration text into Devpost itself.
10. ~~**Measure the cost per proof check.**~~ Measured on the Anthropic Console on Nov 7: the app's first 12 live Claude Haiku calls cost $0.0049 in total, about $0.0004 a call. A quest uses two calls (the proof check and the recap), so about a tenth of a cent per quest, or roughly $1 for 1,000 quests.
11. ~~**The recap with a bad id.**~~ Done: an unknown run says "no recap here", an unfinished one says "not done yet" and links back to the quest, and no signal offers Try again. None of them show the zero stats.
12. ~~**The recap with no GPS.**~~ Done: the distance is hidden when there's no route, and "1 minute" is singular.
13. **Don't promise what isn't built.** This file used to mention a mascot, a monthly UCLA loneliness check, ratings per category, races, 1v1 challenges and appeals. None of those are in the code. Leave them out of the pitch unless someone builds them.
14. **A screen-reader pass on a real phone** (UX, 30 min). Run VoiceOver once through the System 1 flow. axe can't tell whether the order and the labels make sense out loud.
15. ~~**More campus quests and photo lines (#85, #86, #197).**~~ Decided Nov 7 not to do these, so don't pick them up: the 10 extra campus quests (4 newcomer orientation ones) and the "Photo:" line added to every quest went in with #384 and were reverted on purpose in #386. The issues are closed as not planned. The quest pack in `data/quests/quests.json` stays as it is.
