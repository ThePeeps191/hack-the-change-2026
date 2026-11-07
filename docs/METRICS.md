# What we'd measure in a pilot

The outcomes Amble is for, how we'd measure each one in a real pilot, and what the app already counts today. This backs the "clear, measurable outcomes" in Impact and the budget in Feasibility (see [JUDGING.md](JUDGING.md)).

The ground rule: **every number comes from the real tables, never made up.** Where there is no real data yet, we say so. The public page at `/impact` shows the community-wide totals live, and labels them "demo data" while they still come from our made-up seed accounts.

## The pilot

One campus (UCalgary) for six weeks, open to any adult with a campus email. Week 0 is a baseline survey, weeks 1 to 6 are normal use, and week 6 repeats the survey. Campus first because it has density, a shared timetable and free time between classes (see Cold start in JUDGING.md).

## The four outcomes

### 1. Minutes outside, against the 150-minute guideline

- **Why:** only 46% of Canadian adults get the 150 minutes of moderate activity a week that the [Canadian 24-Hour Movement Guidelines](https://csepguidelines.ca/) recommend ([Statistics Canada, 2026](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021c-eng.htm)).
- **What the app counts today:** the minutes from start to finish of every finished quest, for each person on it (`quest_runs.started_at` to `completed_at`, joined to `run_members`). Per person per week on the You tab (`getDashboard`), and added up across everyone on `/impact` (`getImpact`).
- **In the pilot:** the share of participants whose Amble minutes add at least 30 minutes a week, and the change in self-reported weekly active minutes from week 0 to week 6. Amble minutes are walking pace, so we'd report them as "time active outside", not as proof of meeting the guideline.
- **Honest limit:** quest minutes are an upper bound on walking, because someone can stand still during a quest. The GPS route (`location_pings`) gives distance where people allow location.

### 2. Repeat meetings, as a proxy for casual friendship

- **Why:** friendships form from repeated time together. Hall (2019, *Journal of Social and Personal Relationships*, "How many hours does it take to make a friend?") estimates about 50 hours to go from acquaintance to casual friend, and about 90 to friend. One meeting is a nice moment; meeting again is where loneliness numbers can move.
- **What the app counts today:** pairs of people who finished two or more quests together (`familiar_pairs` on `/impact`, and familiar faces with hours together on the You tab). Practice runs with Priya, the bot, never count.
- **In the pilot:** the number of pairs who meet 2+ times, the hours each pair has spent together against Hall's 50, and how many people opt in to stay in touch after a quest (`connections`).
- **Honest limit:** a 20-minute quest is a small slice of 50 hours. We'd claim "the start of familiar faces", not friendships made.

### 3. The felt-better rate

- **Why:** this is the most direct sign that a quest helped someone's day. Brief contact with weak ties measurably lifts mood (Sandstrom and Dunn, 2014).
- **What the app counts today:** an optional one-tap check-in after each quest, stored 1 to 5 (`checkins`, `phase = 'after'`). The felt-better rate is the share at 4 or 5. `docs/CONTRACTS.md` defines the after tap as relative to before (5 better, 3 the same, 1 worse), but the screen today labels it Rough to Great, so `/impact` says "good or better" rather than "better than before" until the labels match. Each person only sees their own pattern; `/impact` shows only the total.
- **In the pilot:** the felt-better rate per week, and how it changes with repeat partners against first meetings. We'd add the UCLA 3-item loneliness scale to the week 0 and week 6 surveys. It isn't in the app today.
- **Honest limit:** the check-in is optional, so people who enjoyed it may answer more. We'd report the response rate next to the felt-better rate.

### 4. Cost per quest

- **Why:** a pilot needs a budget. The organizers' rubric asks for "realistic budgeting" in Feasibility.
- **How we measure it:** every live AI call logs its token counts and nothing else (`logUsage` in `src/lib/gemini-live.ts` and `src/lib/ai-claude.ts`). A line looks like `[gemini] quests: 3200 tokens (2900 in, 300 out) for 3`, where the last number is how many quests that call wrote. Cost per quest is (tokens in × input price + tokens out × output price) ÷ quests written, plus the proof check and the recap for each quest that's played.
- **What keeps it low:** one call writes a batch of quests for an area, which is cached and reused by everyone nearby, and the starter pack is free when the AI is down or slow.
- **Status:** not measured yet. It needs a live run (`AI_MODE=live`) and the provider's published prices on the day. Item 10 of the audit in JUDGING.md tracks it. Don't quote a number until it's measured.

## What we will not measure

No ranking of people on wellbeing, no streaks, no follower counts, and nothing about one person on a public page. `/impact` is totals only: no names and no places.
