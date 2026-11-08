<p align="center">
  <img src="public/icons/icon-192.png" alt="The Amble icon: a lowercase a with the sun in its bowl" width="96" height="96">
</p>

<h1 align="center">Amble</h1>

<p align="center">Twenty minutes, someone new, somewhere outside.</p>

<p align="center">
  <a href="https://amble.health">amble.health</a> ·
  <a href="https://devpost.com/software/9dszkw-small-usage-limits-big-dreams-amble">Devpost</a> ·
  Built in 24 hours at Hack the Change 2026, Calgary
</p>

<p align="center">
  <img src="docs/images/foosball-game.gif" alt="Two people playing foosball in the engineering building at UCalgary, the real place behind one of Amble's quests" height="480">
  <img src="docs/images/app-demo-aaron-and-siddhant.gif" alt="Amble on a phone: Aaron picks a quest and gets matched with Siddhant, and a real photo of the game gets checked: that counts, plus 15 coins" height="480">
</p>

Amble gives strangers short, fun challenges to do together outside. When you have some time, you tap "I'm free", get paired with someone nearby, and meet them at a public spot to do the challenge. We wrote all of them by hand for places Calgarians know, like the +15, Chinatown, Nose Hill and the Calgary Tower. One of ours, at the Foothills Athletic Park: "Film each other running 100 m backwards on the track, then play the videos in reverse to see whose run looks more normal."

You can also start a crew with your friends and compete with other crews to claim spots around campus.

## Try it

Open [amble.health](https://amble.health) on two phones and tap Try the demo on each. You don't need an account. Tap "I'm free" on both and you'll get matched. On your own, Amble tells you nobody's free yet and gives you a link to send to someone. In Chrome on Android you can also install it like an app.

## Why we built it

23% of Canadians aged 15 to 24 always or often feel lonely, the highest of any age group ([Statistics Canada](https://www.statcan.gc.ca/o1/en/plus/274-you-are-not-alone)). In Calgary it's 26% of 18 to 34 year olds ([City of Calgary, 2025](https://www.calgary.ca/content/dam/www/programs-services/social-programs-and-services/mental-health-and-addiction-strategy/mental-health-calgarians-final-report-2025.pdf)). And only 46% of Canadian adults get the recommended 150 active minutes a week ([Statistics Canada](https://www150.statcan.gc.ca/n1/daily-quotidien/261021/dq261021-eng.htm)). We wanted one app that goes after both problems.

Making a friend usually means planning a coffee and making small talk, which is the hard part for newcomers, people living alone and anyone shy. A shared challenge gives you something to do instead.

We were inspired by AR games like Pokemon Go, and the challenges especially by the game show Jet Lag: The Game, which is full of collaborative challenges tied to real places.

## How a quest works

Tap "I'm free" and Amble looks for someone nearby. You both get the same quest at a public place and meet there, never at each other's location, and your location is deleted the moment you're matched. You only see each other's first name once you both say yes, and during the quest, one tap opens 911 and Campus Security or lets you leave. If nobody's around, you can send the quest to someone you're with by link or AirDrop.

Amble picks quests that suit you both: step-free places first, shorter quests if you want an easier pace, and side-by-side quests if you'd rather not chat.

When you've done it, you send a photo or short video and an AI model checks it against the quest. If it passes, you get coins. Then you see a short recap of what you did, and you can choose to stay in touch.

<p align="center">
  <img src="docs/images/aaron-and-siddhant/that-counts.jpg" alt="The AI referee approves a real photo of two people playing foosball: that counts, with a reason naming what it can see" width="250">
  <img src="docs/images/aaron-and-siddhant/rejected-ping-pong.jpg" alt="The AI referee rejects a real photo of two people playing ping pong for a foosball quest, and says what would count" width="250">
  <img src="docs/images/aaron-and-siddhant/recap.jpg" alt="The recap: a short story of the quest, the minutes and coins, and the proof" width="250">
</p>

<p align="center"><sub>Same foosball quest, two real photos. Ping pong doesn't count.</sub></p>

## Crews and Claim

Crews share quests and earn coins together, and the coins go toward a weekly board. Claim is a second game where two crews compete for spots around campus. Each spot has a challenge, for example "Hold a plank for as long as possible and record it. Longer plank wins." If nobody holds a spot, finishing the challenge takes it. If another crew holds it, you have to beat their score to steal it.

The You tab keeps your own numbers, never ranked against anyone: active minutes against Canada's 150-minute guideline, familiar faces (people you've done several quests with), new places, and how you felt before and after each quest. The whole app is built for screen readers and respects Reduce Motion.

<p align="center">
  <img src="docs/images/aaron-and-siddhant/crew-board.jpg" alt="The weekly board: a podium of the top three crews, then the rest" width="250">
  <img src="docs/images/aaron-and-siddhant/claim.jpg" alt="The Claim map of campus, with flags for the zones each crew holds" width="250">
  <img src="docs/images/aaron-and-siddhant/you-tab.jpg" alt="The You tab: active minutes against the 150-minute guideline, quests, distance and people met" width="250">
</p>

<details>
<summary>More screenshots</summary>
<br>

<p align="center">
  <img src="docs/images/aaron-and-siddhant/today.jpg" alt="The Today screen: 79 of 150 active minutes this week, an I'm free button and nearby quests" width="250">
  <img src="docs/images/aaron-and-siddhant/matched.jpg" alt="Matched: you and Siddhant, with the quest you both get" width="250">
  <img src="docs/images/aaron-and-siddhant/quest.jpg" alt="The quest screen: play foosball at the Schulich School of Engineering, with a line on how to spot Siddhant" width="250">
</p>

<p align="center">
  <img src="docs/images/aaron-and-siddhant/crew-page.jpg" alt="The crew page: the crew's own character, its name and its coins" width="250">
  <img src="docs/images/aaron-and-siddhant/steal.jpg" alt="A Claim zone just taken: stolen from north campus walkers, Mac Hall is yours" width="250">
  <img src="docs/images/aaron-and-siddhant/map.jpg" alt="The map of quests around Calgary, each a pin you can tap" width="250">
</p>

</details>

## How we built it

It's one Next.js app on Vercel. Auth0 handles sign-in, and Postgres on Tiger Data stores everything, with location pings in a TimescaleDB hypertable. We wrote every quest by hand, at real places around UCalgary and Calgary. Claude Haiku checks the proof and writes the recaps, and if it's slow or down, your quest still counts. We used Claude Code as a coding assistant.

There are no background workers: the game moves forward whenever a phone checks in, and the server enforces every rule.

Built with Next.js, React, TypeScript, Tailwind CSS, Motion, bun, Postgres, Tiger Data (TimescaleDB), Auth0, Claude Haiku, MapLibre, OpenStreetMap and Vercel.

To run it yourself, see [DEVELOPMENT](docs/DEVELOPMENT.md).

## What's next

All our challenges so far were written by us, so we want to support user-generated challenges for Quests and Claim. We also want to expand beyond Calgary and add new game modes.

## Team

- **Danny Wang** ([@ThePeeps191](https://github.com/ThePeeps191))
- **Siddhant Arora** ([@siddhantarora7](https://github.com/siddhantarora7))
- **Aaron He** ([@mucube](https://github.com/mucube))
- **Jonas Huang** ([@wawahwa801](https://github.com/wawahwa801))
