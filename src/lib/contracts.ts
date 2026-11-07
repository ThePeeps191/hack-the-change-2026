// Shared shapes from docs/CONTRACTS.md. Add fields freely; renames and removals
// must update every caller in the same PR. JSON is snake_case.

export type QuestType = "local" | "anywhere" | "event";
export type ProofKind = "photo" | "video" | "gps";

export type Source = { title: string; uri: string };

export type QuestTag = "newcomer" | "give-back" | "skill-swap" | "calm" | "step-free" | "side-by-side" | "daytime";

// Comfort settings. Matching and quest choice respect them.
export type Prefs = {
  pace?: "any" | "short" | "step-free";
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
  // Added: see the tags in docs/JUDGING.md. Optional on purpose.
  tags?: QuestTag[];
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
};

export type RunMember = {
  user_id: string;
  display_name: string;
  submitted: boolean;
  verdict: Verdict | null;
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
};

export type Verdict = {
  status: "pending" | "approved" | "rejected"; // pending until Gemini replies; poll GET /api/runs/:id
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
  // Added: the human metrics from docs/JUDGING.md. Private, never ranked.
  active_minutes_week: number;
  weekly_goal_min: number; // the 150-minute Canadian guideline
  familiar_faces: FamiliarFace[];
  small_hellos: SmallHello[];
  new_places: number;
  mood: MoodSummary;
};

// Someone you've done 2+ quests with.
export type FamiliarFace = { display_name: string; avatar_url: string | null; quests_together: number; hours_together: number };

// A quest with someone new, as a moment rather than a tally.
export type SmallHello = { run_id: string; display_name: string; quest_title: string; at: string };

export type MoodSummary = { before_avg: number | null; after_avg: number | null; checkins: number };

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
