# Real-world quest website: the idea

Snapshot of the "Idea overview" tab, taken 2026-11-07. The [Google Doc](https://docs.google.com/document/d/1luz-W3rodfUkmfI5yC7BfK8iMFM8vNJVtRyhC5iib8E/edit?usp=sharing) is the source of truth, so if the two disagree, the doc wins. Agents without access to it should use this copy.

Hack the Change 2026, Prompt 1 (health, social connection and well-being). The name is Amble.

## Summary

A web app with two ways to get people outside together: short 20-minute quests you do with someone new nearby, and longer games you play with your friends. We write the quests by hand, at real places; an AI (Claude Haiku) checks the proof and makes a short recap of each one.

> Written before the build, when the plan was Gemini writing quests and Vultr hosting. What we built: hand-made quests, Claude Haiku for proof and recaps, Vercel hosting. Sections below that mention Gemini describe the original plan.

## System 1: 20-minute quests with someone new

You open the app when you have about 20 minutes free. Send requests to strangers through airdrop for activity links.

- **Matching:** pairs two people who are close by and free right now; both have to accept before anything is shared.
- **The quest gives you a reason to talk:** a shared task instead of small talk, such as finding the oldest book on one floor of the library, or trying a snack neither of you has had at the campus market.
- **It ends cleanly:** after about 20 minutes you both submit proof, the AI confirms it, and the quest is done. You can choose to stay in touch or add each other as friends; otherwise no contact details are shared.
- **Safety:** public places and daylight only, a verified account for the first version (for example a student email), and a way to report someone.

## System 2: playing with friends

Friend groups (crews) play longer games together, live or on their own time.

- **Shared quests:** friends send each other quests and do them together or race each other.
- **Anywhere quests:** fitness quests that work in any city, such as running 3 km or holding a 2-minute plank, so friends in different cities can still compete.
- **Coins and leaderboard:** completed quests earn coins toward a crew leaderboard.
- **Dashboard:** each user's quest history and a map of completed quests with event icons.

### Game modes

- **Claim (main mode):** teams claim zones by completing that zone's challenge, and a rival team can steal a zone by beating the result. Inspired by Jet Lag's Battle 4 America.
- **Hide and seek (stretch goal):** one team hides in an area while the others narrow it down with questions the app answers from GPS.

The two systems feed each other: someone you meet on a 20-minute quest can join your crew.

## What Gemini does in both

- **Writes quests:** local quests from live Google Maps data (what's open, what's nearby, the weather) and event quests from Google Search (club fairs, games, free talks). Calgary and UCalgary get a hand-tuned starter set for local impact.
- **Checks proof:** compares photos and short videos against the quest, the location and the time window, so no human judge is needed.
- **Makes recaps:** a short summary of each quest or match with the route, the verified photos and narration.

## Why this idea

- **Loneliness in Calgary:** 15% of Calgarians often or always feel lonely and another 31% sometimes do; among 18 to 34 year olds, 26% often or always do ([City of Calgary, Mental Health of Calgarians survey, 2025](https://www.calgary.ca/content/dam/www/programs-services/social-programs-and-services/mental-health-and-addiction-strategy/mental-health-calgarians-final-report-2025.pdf), pages 53 and 54; a phone survey of 1,255 Calgarians by Advanis, April to May 2025).
- **Loneliness:** 23% of Canadians aged 15 to 24 always or often feel lonely, the highest of any age group ([Statistics Canada, 2021](https://www.statcan.gc.ca/o1/en/plus/274-you-are-not-alone)).
- **Inactivity:** only 46% of Canadian adults get the recommended 150 minutes of activity a week ([Statistics Canada, 2026](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021c-eng.htm)).
- **Prompt fit:** health (every quest gets people walking or moving outdoors), social connection (meeting someone new and playing with friends), well-being (play, novelty and time outside), and communities (quests send people to local shops, parks, libraries and campus events).
- **Why now:** Gemini's Grounding with Google Maps, launched in October 2025, covers more than 250 million places, which makes it practical to write good local quests for any area ([Google](https://blog.google/technology/developers/grounding-google-maps-gemini-api/)).
- Lack of stranger-stranger connection and contact.

## What makes it different

- **A short, structured way to meet people:** meetup apps such as Zugo and Friending match nearby people for open-ended hangouts. Ours gives two people one 20-minute task, so there's nothing to plan and a natural end.
- **No setup for friend games:** city-game apps such as Zone Tag and We Clue need someone to design the map or approve photos. Gemini builds and judges ours for any area.
- **A recap for every quest:** something to share afterwards.

## Tech stack (draft)

- Mobile-first website that can be added to the home screen, shared by link or QR code.
- Matching service that pairs nearby people who are free now.
- Gemini API for quest generation (Maps and Search grounding), photo and video checks, and recaps.
- Tiger Data for location history, quest history and leaderboards.
- Auth0 for login and account verification, Vercel for hosting (the plan said Vultr), and a GoDaddy Registry domain (amble.health).

## Open questions

- Mascot.
- Safety rules for meeting someone new: age limit, verification and reporting.
- Keep hide and seek, or drop it.
- Whether to add ratings and personas later.
- Whether a TensorFlow vision model adds anything beyond Gemini's checks.
- Motion context, such as telling transit apart from walking: now or later.

## Earlier brainstorm

From Tab 1 of the doc. These notes aren't commitments, but they may help:

- Activities last 20 minutes at most.
- Challenges tied to Calgary landmarks, like Jet Lag the Game, such as finding a specific book in the Central Library.
- Public AirDrop links for reaching strangers.
- Design wishes: a mascot, custom icons for each event type, and a unified design system.
- The demo should use ideas curated to the UCalgary campus if it's a video, and be interactive with judges if in person, since we have a domain.
- Auth0 is a sponsor track.
