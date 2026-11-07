-- The whole schema from docs/CONTRACTS.md. Later changes go in new files.

create table users (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text not null unique,
  display_name text not null,
  avatar_url text,
  email_verified boolean not null default false,
  age_confirmed_at timestamptz,
  prefs jsonb not null default '{}',
  coins integer not null default 0,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

-- One row per person who is free right now. It's deleted the moment they're
-- paired, so a location is never kept longer than the search needs it.
create table availability (
  user_id uuid primary key references users (id),
  lat double precision not null,
  lng double precision not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table quests (
  id text primary key,
  title text not null,
  description text not null,
  type text not null check (type in ('local', 'anywhere', 'event')),
  lat double precision,
  lng double precision,
  radius_m integer,
  duration_min integer not null,
  proof text not null check (proof in ('photo', 'video', 'gps')),
  coins integer not null default 0,
  place_name text,
  sources jsonb not null default '[]',
  tags jsonb not null default '[]',
  starter boolean not null default false,
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references users (id),
  user_b uuid references users (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  source text not null check (source in ('nearby', 'invite')),
  invite_code text unique,
  a_accepted_at timestamptz,
  b_accepted_at timestamptz,
  distance_m integer,
  lat double precision,
  lng double precision,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index matches_user_a on matches (user_a, created_at desc);
create index matches_user_b on matches (user_b, created_at desc);

create table crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references users (id),
  rating double precision not null default 1500,
  rating_rd double precision not null default 350,
  rating_vol double precision not null default 0.06,
  created_at timestamptz not null default now()
);

create table crew_members (
  crew_id uuid not null references crews (id),
  user_id uuid not null references users (id),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index crew_members_user on crew_members (user_id);

create table crew_quests (
  crew_id uuid not null references crews (id),
  quest_id text not null references quests (id),
  shared_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  primary key (crew_id, quest_id)
);

create table games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('lobby', 'active', 'finished')),
  created_by uuid not null references users (id),
  created_at timestamptz not null default now()
);

create table game_teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id),
  crew_id uuid not null references crews (id),
  name text not null,
  unique (game_id, crew_id)
);

create table zones (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null,
  quest_id text not null references quests (id),
  held_by_team_id uuid references game_teams (id),
  best_result double precision,
  result_unit text,
  lower_is_better boolean not null default false
);
create index zones_game on zones (game_id);

create table quest_runs (
  id uuid primary key default gen_random_uuid(),
  quest_id text not null references quests (id),
  match_id uuid unique references matches (id),
  crew_id uuid references crews (id),
  zone_id uuid references zones (id),
  team_id uuid references game_teams (id),
  mode text not null check (mode in ('pair', 'crew', 'claim')),
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  completed_at timestamptz
);
create index quest_runs_crew on quest_runs (crew_id, status);
create index quest_runs_zone on quest_runs (zone_id);

create table run_members (
  run_id uuid not null references quest_runs (id),
  user_id uuid not null references users (id),
  distance_m integer,
  stay_in_touch_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (run_id, user_id)
);
create index run_members_user on run_members (user_id);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references quest_runs (id),
  user_id uuid not null references users (id),
  media_url text,
  media_path text,
  media_type text,
  lat double precision,
  lng double precision,
  taken_at timestamptz,
  verdict text not null default 'pending' check (verdict in ('pending', 'approved', 'rejected')),
  reason text not null default '',
  mock_verdict text,
  created_at timestamptz not null default now()
);
create index submissions_run on submissions (run_id, user_id, created_at desc);

create table recaps (
  run_id uuid primary key references quest_runs (id),
  summary text not null,
  narration_url text,
  created_at timestamptz not null default now()
);

create table location_pings (
  time timestamptz not null,
  user_id uuid not null references users (id),
  run_id uuid not null references quest_runs (id),
  lat double precision not null,
  lng double precision not null
);
create index location_pings_run on location_pings (run_id, user_id, time);

-- Written only when both people opt in. user_a is always the smaller id.
create table connections (
  user_a uuid not null references users (id),
  user_b uuid not null references users (id),
  run_id uuid references quest_runs (id),
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users (id),
  reported_id uuid not null references users (id),
  run_id uuid references quest_runs (id),
  reason text not null,
  created_at timestamptz not null default now()
);
create index reports_pair on reports (reporter_id, reported_id);

-- A partial unique index keeps coin awards idempotent per person per run.
create table coin_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  crew_id uuid references crews (id),
  run_id uuid references quest_runs (id),
  amount integer not null,
  created_at timestamptz not null default now()
);
create unique index coin_events_once on coin_events (user_id, run_id) where run_id is not null;
create index coin_events_recent on coin_events (user_id, created_at desc);

create table zone_attempts (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones (id),
  team_id uuid not null references game_teams (id),
  run_id uuid not null unique references quest_runs (id),
  result double precision not null,
  won boolean not null,
  created_at timestamptz not null default now()
);

-- One-tap mood before and after a quest. Private, never ranked.
create table checkins (
  run_id uuid not null references quest_runs (id),
  user_id uuid not null references users (id),
  phase text not null check (phase in ('before', 'after')),
  mood integer not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (run_id, user_id, phase)
);
