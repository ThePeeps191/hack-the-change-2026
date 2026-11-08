// Shared shapes from docs/CONTRACTS.md. Add fields freely; renames and removals
// must update every caller in the same PR. JSON is snake_case.

export type QuestType = "local" | "anywhere" | "event";
export type ProofKind = "photo" | "video" | "gps";

export type Source = { title: string; uri: string };

export type QuestTag = "newcomer" | "give-back" | "skill-swap" | "calm" | "step-free" | "side-by-side" | "daytime";

// Comfort settings. Matching and quest choice respect them.
export type Prefs = {
  pace?: "any" | "short" | "brisk";
  step_free?: boolean;
  social?: "chatty" | "side-by-side";
  language?: string; // BCP 47, e.g. "en", "fr", "zh"
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  lat: number | null; // null for anywhere quests
  lng: number | null;
  radius_m: number | null;
  duration_min: number; // 20 at most for System 1
  proof: ProofKind;
  coins: number;
  place_name: string | null;
  sources: Source[];
  // Added: optional tags, e.g. newcomer, give-back, skill-swap, calm, step-free, side-by-side.
  tags?: string[];
};

export type User = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  age_confirmed_at: string | null;
  prefs: Prefs;
  coins: number;
  created_at: string;
};

export type Partner = { display_name: string; avatar_url: string | null };

export type MatchStatus = "pending" | "accepted" | "declined" | "expired";

export type Match = {
  id: string;
  status: MatchStatus;
  source: "nearby" | "invite";
  partner: Partner | null; // null until both accept
  run_id: string | null; // the server creates the run once both accept; clients never create pair runs
  // Added: lets the UI show "waiting for them" after you accept.
  you_accepted?: boolean;
  // Added: rough distance to the partner, never their location.
  distance_m?: number | null;
  // Added: quests you've finished together before, once both have accepted.
  times_together?: number;
  // Added: true when the partner is Priya, the demo bot, so the UI can say so. Never pretend she's a person.
  demo_partner?: boolean;
  // Added: the quest an invite pinned, so the waiting screen can name it.
  quest_title?: string | null;
  // Added: the invite's code, only for the person who made the link and only while it's pending.
  invite_code?: string | null;
};

export type RunMember = {
  user_id: string;
  display_name: string;
  submitted: boolean;
  verdict: Verdict | null;
  // Added: "how to spot me" on a quest with someone new, e.g. "red jacket, by the doors". Pair runs only.
  hint?: string | null;
};

// One group doing one quest
export type QuestRun = {
  id: string;
  quest: Quest;
  mode: "pair" | "crew" | "claim";
  status: "active" | "completed" | "expired";
  started_at: string;
  ends_at: string;
  members: RunMember[];
  zone_id?: string | null; // Claim runs: the zone this challenge is for
  crew_id?: string | null; // Added: set when started with a crew, so the quest screen can offer "Finish now"
};

export type Verdict = {
  status: "pending" | "approved" | "rejected"; // pending until the AI replies; poll GET /api/runs/:id
  reason: string; // shown to the user, empty while pending
  // Added: coins awarded when approved.
  coins?: number;
};

export type RoutePoint = { lat: number; lng: number; at: string };

export type Recap = {
  run_id: string;
  summary: string;
  route: RoutePoint[];
  photos: string[];
  narration_url: string | null;
  // Added for the recap screen.
  title?: string;
  duration_min?: number;
  distance_m?: number;
  coins?: number;
  partner?: Partner | null;
  // Added: quests finished with this partner, including this one.
  times_together?: number;
  // Added: the partner is the practice bot (demo only).
  demo_partner?: boolean;
  // Added: you and this partner already said yes to staying in touch.
  connected?: boolean;
  // Added: when the quest finished (ISO).
  completed_at?: string;
  // Added: the same proof as `photos`, with each file's type, so a video plays as a video.
  // `stills`: a clip too long to upload, kept as one image of three stills from it.
  proof?: { url: string; type: string; stills?: boolean }[];
  // Added: your own mood check-ins for this quest (1 to 5), only ever sent to you. Null if skipped.
  mood_before?: number | null;
  mood_after?: number | null;
};

export type CrewMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  coins: number;
  joined_at: string;
};

export type Crew = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  members: CrewMember[];
  shared_quests: Quest[];
  coins: number;
  rating?: number;
};

export type LeaderboardEntry = {
  rank: number;
  id: string; // crew id, or user id when ranking a crew's members
  name: string;
  coins: number;
  rating?: number;
  delta?: number; // coins gained recently, for the "coins landing" animation
};

export type HistoryItem = {
  run_id: string;
  quest: Quest;
  completed_at: string;
  coins: number;
  partner: Partner | null;
  distance_m: number;
};

export type Dashboard = {
  quests_done: number;
  km_moved: number;
  people_met: number;
  coins: number;
  minutes_outside: number;
  streak_days: number;
  rating?: number;
  history: HistoryItem[];
  // Added: human metrics (see docs/JUDGING.md). All optional.
  active_minutes_week?: number; // walking minutes during quests this week
  active_goal_minutes?: number; // 150, the Canadian 24-Hour Movement Guidelines target
  familiar_faces?: FamiliarFace[]; // people you've done 2+ quests with
  new_places?: { name: string; lat: number; lng: number; first_visit: string }[];
  mood?: { after_better: number; checkins: number }; // check-ins where you felt better after
  sample_quests?: number; // "Try the demo" guests start with a few sample quests; this many of yours are samples
  small_hellos?: SmallHello[]; // a quest with someone new, as a moment rather than a tally
  week?: WeekDay[]; // this week, Monday to Sunday in Calgary time (TimescaleDB time_bucket on Tiger)
};

export type WeekDay = {
  day: string; // YYYY-MM-DD
  quests: number; // quests you finished that day
  quest_minutes: number; // minutes on quests you finished that day
  moving_minutes: number; // minutes with GPS pings while on a quest that day
};

export type FamiliarFace = {
  display_name: string;
  avatar_url: string | null;
  quests_together: number;
  minutes_together: number;
  last_seen: string;
};

export type SmallHello = { run_id: string; display_name: string; quest_title: string; at: string };

export type Checkin = { phase: "before" | "after"; mood: number };

export type Zone = {
  id: string;
  game_id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  quest_id: string;
  held_by_team_id: string | null;
  best_result: number | null;
  // Added: what best_result measures, e.g. "seconds", "reps", "metres".
  result_unit?: string;
  quest?: Quest;
  // Added: whether a smaller result wins (a faster time), and your team's run
  // for this zone that hasn't been turned into an attempt yet.
  lower_is_better?: boolean;
  my_run_id?: string | null;
  my_run_ready?: boolean; // that run has approved proof, so a result can be sent
};

export type GameTeam = { id: string; game_id: string; crew_id: string; name: string };

export type Game = {
  id: string;
  name: string;
  status: "lobby" | "active" | "finished";
  created_by: string;
  created_at: string;
  teams: GameTeam[];
  zones: Zone[];
};

export type Connection = { user_id: string; display_name: string; avatar_url: string | null };

export type ApiError = { error: string };
