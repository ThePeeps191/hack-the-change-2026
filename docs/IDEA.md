# Real-world quest app: the idea

Snapshot of the "Idea overview" tab, taken 2026-11-07. The [Google Doc](https://docs.google.com/document/d/1luz-W3rodfUkmfI5yC7BfK8iMFM8vNJVtRyhC5iib8E/edit?usp=sharing) is the source of truth, so if the two disagree, the doc wins. Agents without access to it should use this copy.

Hack the Change 2026, Prompt 1 (health, social connection and well-being). Working name to be decided; shortlist: Skip, Amble, Outbound.

## Summary

A web app that turns wherever you are into a Jet Lag-style game you play with friends. Gemini is the game master: it writes quests for your area, checks the proof, and turns each match into a short recap you can share.

## How it works

### Quest types

1. **Local quests:** Gemini writes them for your area using live Google Maps data, such as what's open, what's nearby and today's weather. Calgary and UCalgary get a hand-tuned starter set for local impact, for example finding a specific book in the Central Library.
2. **Anywhere quests:** fitness quests that work in any city, such as running 3 km or holding a 2-minute plank, so friends in different cities can compete on the same quest.
3. **Event quests:** Gemini uses Google Search to find what's on today, such as club fairs, games or free talks.

### What Gemini does

- **Game master:** writes quests, scales difficulty to the group, and keeps them safe (walking, public places, daylight).
- **Referee:** checks photo and video proof against the quest, the location and the time window, so no human judge is needed.
- **Producer:** after a match, writes a recap with a map replay of each team's route, the verified clips and narration.

### Friends, ratings and personas

- **Crews:** friend groups play together or against each other, live or on their own time.
- **Ratings:** chess-style ratings per category (fitness, exploring, social). Quests have ratings too, so everyone competes at their own level.
- **Coins and leaderboard:** completing a quest earns coins toward a crew leaderboard.
- **Personas:** each player earns a persona from the quests they do, such as the Explorer, the Speedrunner or the Foodie, which gives friends something to talk about.
- **Dashboard:** each user's stats, quest history and a map of completed quests with event icons.

### Game modes

- **Claim (main mode):** teams claim zones by completing that zone's challenge, and a rival team can steal a zone by beating the result. Inspired by Jet Lag's Battle 4 America.
- **Hide and seek (stretch goal):** one team hides in an area while the others narrow it down with questions the app answers from GPS.

## Why this idea

- **Loneliness:** 23% of Canadians aged 15 to 24 always or often feel lonely, the highest of any age group ([Statistics Canada, 2021](https://www.statcan.gc.ca/o1/en/plus/274-you-are-not-alone)).
- **Inactivity:** only 46% of Canadian adults get the recommended 150 minutes of activity a week ([Statistics Canada, 2026](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021c-eng.htm)).
- **Prompt fit:** health (walking, running, time outdoors), social connection (played with friends, including friends in other cities), well-being (play and novelty), and communities (sends people to local shops, parks, libraries and campus events).
- **Why now:** Gemini's Grounding with Google Maps, launched in October 2025, covers more than 250 million places, which makes an AI game master practical for any neighbourhood ([Google](https://blog.google/technology/developers/grounding-google-maps-gemini-api/)).

## What makes it different

City-game apps already exist, such as Zone Tag, We Clue and Hide and Chase, but they need someone to design the map or approve the photos. Ours needs neither.

- **No setup:** Gemini builds a game for any area in seconds.
- **AI referee:** proof is checked automatically.
- **Recap:** every match ends with a shareable episode.
- **Fair ratings and personas:** everyone competes at their own level and gets an identity from how they play.

## Tech stack (draft)

- Mobile-first website that can be added to the home screen, shared by link or QR code.
- Gemini API for quest generation (Maps and Search grounding), photo and video checks, and the recap script and voice.
- Tiger Data for GPS trails, quest history and leaderboards.
- Auth0 for login and user metrics, Vultr for hosting, and a GoDaddy Registry domain.

## Open questions

- Name and mascot.
- Keep hide and seek, or drop it.
- Whether a TensorFlow vision model adds anything beyond Gemini's checks.
- Motion context, such as telling transit apart from walking: now or later.

## Earlier brainstorm

From Tab 1 of the doc. These notes are not commitments but may help during planning:

- The demo should use ideas curated to the UCalgary campus if it's a video, and be interactive with judges if in person, since we have a domain.
- Design wishes: a mascot, custom icons per event type, and a unified design system.
- Public AirDrop links as a way to share the app.
