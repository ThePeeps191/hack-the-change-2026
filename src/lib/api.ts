// The thin client layer: every screen talks to the server through these, so
// swapping mocks for real endpoints never touches UI code.
import type {
  Crew,
  Dashboard,
  Game,
  LeaderboardEntry,
  Match,
  Quest,
  QuestRun,
  Recap,
  User,
  Verdict,
  Zone,
} from "./contracts";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: isForm || !init?.body ? init?.headers : { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "no connection");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText);
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  call<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) });

export const api = {
  me: () => call<User>("/api/me"),
  updateMe: (patch: Partial<User>) => call<User>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),

  setFree: (lat: number, lng: number) => post<{ expires_at: string }>("/api/availability", { lat, lng }),
  clearFree: () => call<void>("/api/availability", { method: "DELETE" }),
  match: () => call<Match | null>("/api/match"),
  acceptMatch: (id: string) => post<Match>(`/api/matches/${id}/accept`),
  declineMatch: (id: string) => post<Match>(`/api/matches/${id}/decline`),
  createInvite: () => post<{ code: string; url: string }>("/api/invites"),
  acceptInvite: (code: string) => post<Match>(`/api/invites/${code}/accept`),

  generateQuests: (lat: number, lng: number, count?: number) => post<Quest[]>("/api/quests/generate", { lat, lng, count }),
  quest: (id: string) => call<Quest>(`/api/quests/${id}`),

  startRun: (body: { quest_id: string; match_id?: string; crew_id?: string; zone_id?: string }) => post<QuestRun>("/api/runs", body),
  run: (id: string) => call<QuestRun>(`/api/runs/${id}`),
  submitProof: (id: string, form: FormData) => post<Verdict>(`/api/runs/${id}/submissions`, form),
  recap: (id: string) => call<Recap>(`/api/runs/${id}/recap`),
  sendLocation: (run_id: string, points: { lat: number; lng: number; at: string }[]) => post<void>("/api/location", { run_id, points }),

  connect: (run_id: string) => post<{ connected: boolean }>("/api/connections", { run_id }),
  report: (body: { reported_id: string; run_id: string; reason: string }) => post<void>("/api/reports", body),

  createCrew: (name: string) => post<Crew>("/api/crews", { name }),
  crew: (id: string) => call<Crew>(`/api/crews/${id}`),
  joinCrew: (invite_code: string) => post<Crew>("/api/crews/join", { invite_code }),
  shareQuest: (crewId: string, quest_id: string) => post<void>(`/api/crews/${crewId}/quests`, { quest_id }),
  leaderboard: (crew_id?: string) => call<LeaderboardEntry[]>(`/api/leaderboard${crew_id ? `?crew_id=${crew_id}` : ""}`),

  dashboard: () => call<Dashboard>("/api/dashboard"),

  createGame: () => post<Game>("/api/games"),
  game: (id: string) => call<Game>(`/api/games/${id}`),
  attemptZone: (gameId: string, zoneId: string, body: { run_id: string; result: number }) =>
    post<Zone>(`/api/games/${gameId}/zones/${zoneId}/attempts`, body),
};
