// Shared shapes from docs/CONTRACTS.md. Add fields freely; renames and removals
// must update every caller in the same PR. JSON is snake_case.

export type QuestType = "local" | "anywhere" | "event";
export type ProofKind = "photo" | "video" | "gps";

export type Source = { title: string; uri: string };

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
};

export type User = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email_verified: boolean;
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
  run_id: string | null;
  // Added: lets the UI show "waiting for them" after you accept.
  you_accepted?: boolean;
  // Added: rough distance to the partner, never their location.
  distance_m?: number | null;
};

export type RunMember = { user_id: string; display_name: string; submitted: boolean };

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
  status: "approved" | "rejected";
  reason: string; // shown to the user
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
};

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

export type ApiError = { error: string };
