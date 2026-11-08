# Claim: the rules

The answers to "how do you win?" for Q&A. The code is `src/server/games.ts`.

- **The board:** five zones on campus, each with its own challenge and a number to beat (a time, a count or a distance).
- **Taking a zone:** finish its challenge with approved proof, then send your result. An empty zone goes to whoever finishes first.
- **Stealing a zone:** beat the zone's best result. Results have to be within sane bounds for that zone (`src/lib/claim-bounds.ts`), so nobody can type -99999.
- **Winning:** the crew holding the most zones is winning. The screen shows "yours, theirs, open" at all times.
- **Who plays:** your crew, plus a rival crew if you start the game with their crew code. Without one, your crew plays for the map on its own.
- **One game at a time:** starting a new game ends your crew's old one.
- **Ratings:** a steal is the one real win and loss in the app, so it's the only thing that moves a crew's rating (Glicko-2). Quests with strangers are cooperative and never touch a rating.
- **Coins** are a separate score: every quest earns them for you and your crew, and they rank the weekly crew board.
