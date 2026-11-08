// The thin client layer: every screen talks to the server through these, so
// swapping mocks for real endpoints never touches UI code.
import type {
  Checkin,
  Connection,
  Crew,
  Dashboard,
  LeaderboardEntry,
  Match,
  Quest,
  QuestRun,
  Recap,
  User,
  Verdict,
} from "./contracts";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Mock login only: /?as=priya makes this tab Priya, so two tabs can be two
// people. The server ignores the header unless AUTH_MODE=mock.
function devIdentity(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const as = new URLSearchParams(window.location.search).get("as");
    if (as) sessionStorage.setItem("amble_as", as);
    const name = sessionStorage.getItem("amble_as");
    return name ? { "x-amble-user": name } : {};
  } catch {
    return {};
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        ...(isForm || !init?.body
          ? {}
          : { "content-type": "application/json" }),
        ...devIdentity(),
        ...init?.headers,
      },
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
  call<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const api = {
  me: () => call<User>("/api/me"),
  updateMe: (patch: Partial<User>) =>
    call<User>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),
  deleteMe: () => call<void>("/api/me", { method: "DELETE" }),

  setFree: (lat: number, lng: number) =>
    post<{ expires_at: string }>("/api/availability", { lat, lng }),
  clearFree: () => call<void>("/api/availability", { method: "DELETE" }),
  match: () => call<Match | null>("/api/match"),
  acceptMatch: (id: string) => post<Match>(`/api/matches/${id}/accept`),
  declineMatch: (id: string) => post<Match>(`/api/matches/${id}/decline`),
  createInvite: (questId?: string) =>
    post<{ code: string; url: string }>(
      "/api/invites",
      questId ? { quest_id: questId } : {},
    ),
  inviteDetails: (code: string) =>
    call<{
      code: string;
      status: string;
      expired: boolean;
      quest: Quest | null;
      host_id: string;
      host_name: string | null;
    }>(`/api/invites/${code}`),
  acceptInvite: (code: string, pos?: { lat: number; lng: number }) =>
    post<Match>(`/api/invites/${code}/accept`, pos),

  generateQuests: (lat: number, lng: number, count?: number) =>
    post<Quest[]>("/api/quests/generate", { lat, lng, count }),
  quests: (type?: Quest["type"]) =>
    call<Quest[]>(`/api/quests${type ? `?type=${type}` : ""}`),
  quest: (id: string) => call<Quest>(`/api/quests/${id}`),

  // Crew and solo runs only; pair runs arrive on Match.run_id.
  startRun: (body: { quest_id: string; crew_id?: string }) =>
    post<QuestRun>("/api/runs", body),
  run: (id: string) => call<QuestRun>(`/api/runs/${id}`),
  currentRun: () => call<QuestRun | null>("/api/runs/current"),
  checkin: (id: string, body: Checkin) =>
    post<void>(`/api/runs/${id}/checkins`, body),
  submitProof: (id: string, form: FormData) =>
    post<Verdict>(`/api/runs/${id}/submissions`, form),
  recap: (id: string) => call<Recap>(`/api/runs/${id}/recap`),
  sendLocation: (
    run_id: string,
    points: { lat: number; lng: number; at: string }[],
  ) => post<void>("/api/location", { run_id, points }),

  connections: () => call<Connection[]>("/api/connections"),
  connect: (run_id: string) =>
    post<{ connected: boolean }>("/api/connections", { run_id }),
  report: (body: { reported_id: string; run_id: string; reason: string }) =>
    post<void>("/api/reports", body),

  crews: () => call<Crew[]>("/api/crews"),
  createCrew: (name: string) => post<Crew>("/api/crews", { name }),
  crew: (id: string) => call<Crew>(`/api/crews/${id}`),
  crewForCode: (code: string) => call<{ name: string }>(`/api/crews/join?code=${encodeURIComponent(code)}`),
  joinCrew: (invite_code: string) =>
    post<Crew>("/api/crews/join", { invite_code }),
  shareQuest: (crewId: string, quest_id: string) =>
    post<void>(`/api/crews/${crewId}/quests`, { quest_id }),
  leaderboard: (crew_id?: string) =>
    call<LeaderboardEntry[]>(
      `/api/leaderboard${crew_id ? `?crew_id=${crew_id}` : ""}`,
    ),

  dashboard: () => call<Dashboard>("/api/dashboard"),
};
