# Contracts

The shapes everyone builds against, so the UI, backend and Gemini work can happen at the same time. This is a first draft to agree on at kickoff, based on the quest format in the Google Doc. After the scaffold, `src/lib/contracts.ts` holds the real types. Add to these freely, and see `CLAUDE.md` for renames.

Conventions: JSON uses `snake_case`, ids are UUID strings, times are ISO 8601, and errors look like `{ "error": "message" }`. Requests are authenticated by the session cookie.

## Quest

```ts
type Quest = {
  id: string;
  title: string;
  description: string;
  type: 'local' | 'anywhere' | 'event';
  lat: number | null;       // null for anywhere quests
  lng: number | null;
  radius_m: number | null;
  duration_min: number;     // 20 at most for System 1
  proof: 'photo' | 'video' | 'gps';
  // Added to the doc's format:
  coins: number;
  place_name: string | null;
  sources: { title: string; uri: string }[];  // grounding sources to display
};
```

## Other shared shapes

```ts
type Match = {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  source: 'nearby' | 'invite';
  partner: { display_name: string; avatar_url: string | null } | null;  // null until both accept
  run_id: string | null;
};

// One group doing one quest
type QuestRun = {
  id: string;
  quest: Quest;
  mode: 'pair' | 'crew' | 'claim';
  status: 'active' | 'completed' | 'expired';
  started_at: string;
  ends_at: string;
  members: { user_id: string; display_name: string; submitted: boolean }[];
};

type Verdict = {
  status: 'approved' | 'rejected';
  reason: string;           // shown to the user
};

type Recap = {
  run_id: string;
  summary: string;
  route: { lat: number; lng: number; at: string }[];
  photos: string[];
  narration_url: string | null;
};
```

## Database tables

Plain Postgres on Tiger Data. Backend area drafts these, and the UI area checks that the dashboard has what it needs.

| Table | Main columns |
| --- | --- |
| `users` | id, auth0_sub, display_name, avatar_url, email_verified, coins, created_at |
| `availability` | user_id, lat, lng, expires_at |
| `matches` | id, user_a, user_b, status, source, invite_code, created_at |
| `quests` | the Quest fields, plus created_at |
| `quest_runs` | id, quest_id, match_id, crew_id, zone_id, mode, status, started_at, ends_at |
| `run_members` | run_id, user_id |
| `submissions` | id, run_id, user_id, media_url, media_type, lat, lng, taken_at, verdict, reason |
| `recaps` | run_id, summary, narration_url, created_at |
| `location_pings` | time, user_id, run_id, lat, lng (a Tiger Data hypertable) |
| `connections` | user_a, user_b, run_id, created_at, written only when both opt in |
| `reports` | id, reporter_id, reported_id, run_id, reason, created_at |
| `crews` | id, name, invite_code, created_by, created_at |
| `crew_members` | crew_id, user_id, joined_at |
| `coin_events` | id, user_id, crew_id, run_id, amount, created_at |
| `games` | id, name, status, created_by, created_at |
| `game_teams` | id, game_id, crew_id, name |
| `zones` | id, game_id, name, lat, lng, radius_m, quest_id, held_by_team_id, best_result |
| `zone_attempts` | id, zone_id, team_id, run_id, result, created_at |

## API

| Method and path | What it does | Returns |
| --- | --- | --- |
| `GET /api/me` | Current user | user |
| `PATCH /api/me` | Update profile | user |
| `POST /api/availability` | "I'm free": `{ lat, lng }` | `{ expires_at }` |
| `DELETE /api/availability` | No longer free | nothing |
| `GET /api/match` | Current match, polled | `Match` or null |
| `POST /api/matches/:id/accept` | Accept a match | `Match` |
| `POST /api/matches/:id/decline` | Decline a match | `Match` |
| `POST /api/invites` | Create a link to send a stranger | `{ code, url }` |
| `POST /api/invites/:code/accept` | Open a stranger's invite | `Match` |
| `POST /api/quests/generate` | `{ lat, lng, count? }` | `Quest[]` |
| `GET /api/quests/:id` | One quest | `Quest` |
| `POST /api/runs` | Start a quest: `{ quest_id, match_id?, crew_id?, zone_id? }` | `QuestRun` |
| `GET /api/runs/:id` | Run status, polled | `QuestRun` |
| `POST /api/runs/:id/submissions` | Multipart: media, lat, lng, taken_at | `Verdict` |
| `GET /api/runs/:id/recap` | Recap for a finished run | `Recap` |
| `POST /api/location` | Batch of pings: `{ run_id, points }` | nothing |
| `POST /api/connections` | Opt in to stay in touch: `{ run_id }` | `{ connected }` |
| `POST /api/reports` | `{ reported_id, run_id, reason }` | nothing |
| `POST /api/crews` | `{ name }` | crew with `invite_code` |
| `GET /api/crews/:id` | Crew, members and shared quests | crew |
| `POST /api/crews/join` | `{ invite_code }` | crew |
| `POST /api/crews/:id/quests` | Share a quest with the crew: `{ quest_id }` | nothing |
| `GET /api/leaderboard` | `?crew_id=` for one crew, otherwise all crews | ranked list |
| `GET /api/dashboard` | Quests done, km moved, people met, coins, history | dashboard |
| `POST /api/games` | Start a Claim game | game with zones |
| `GET /api/games/:id` | Game state for the map, polled | game with zones |
| `POST /api/games/:id/zones/:zone_id/attempts` | Claim or steal: `{ run_id, result }` | zone |
