import "server-only";
import type { Match, Quest, QuestRun, Verdict } from "@/lib/contracts";
import { mockPartner, mockPartnerId, mockUser } from "./user";

// In-memory state for mock mode, so the System 1 flow is clickable end to end:
// free -> (4s) match found -> accept -> (2s) partner accepts -> run -> proof.
// Lives on globalThis so it survives hot reloads. One shared mock user.

const SEARCH_MS = 4000;
const PARTNER_ACCEPT_MS = 2000;
const PARTNER_SUBMIT_MS = 5000;

type State = {
  freeSince: number | null;
  match: (Match & { created: number; accepted_at: number | null }) | null;
  runs: Map<string, QuestRun & { partnerSubmitAt: number | null }>;
};

const g = globalThis as unknown as { __mockState?: State };
const state: State = (g.__mockState ??= { freeSince: null, match: null, runs: new Map() });

export function setFree(free: boolean) {
  state.freeSince = free ? Date.now() : null;
  if (!free) state.match = null;
}

export function currentMatch(): Match | null {
  const now = Date.now();
  if (!state.match && state.freeSince && now - state.freeSince > SEARCH_MS) {
    state.match = {
      id: crypto.randomUUID(),
      status: "pending",
      source: "nearby",
      partner: null,
      run_id: null,
      you_accepted: false,
      distance_m: 260,
      created: now,
      accepted_at: null,
    };
  }
  const m = state.match;
  if (m && m.status === "pending" && m.accepted_at && now - m.accepted_at > PARTNER_ACCEPT_MS) {
    m.status = "accepted";
    m.partner = mockPartner;
  }
  return m ? publicMatch(m) : null;
}

export function respond(id: string, accept: boolean): Match | null {
  const m = state.match;
  if (!m || m.id !== id) return null;
  if (accept) {
    m.you_accepted = true;
    m.accepted_at = Date.now();
  } else {
    m.status = "declined";
    state.freeSince = null;
  }
  const out = publicMatch(m);
  if (!accept) state.match = null;
  return out;
}

export function acceptInvite(): Match {
  state.match = {
    id: crypto.randomUUID(),
    status: "accepted",
    source: "invite",
    partner: mockPartner,
    run_id: null,
    you_accepted: true,
    distance_m: null,
    created: Date.now(),
    accepted_at: Date.now(),
  };
  return publicMatch(state.match);
}

export function startRun(quest: Quest, mode: QuestRun["mode"] = "pair"): QuestRun {
  const now = Date.now();
  const run = {
    id: crypto.randomUUID(),
    quest,
    mode,
    status: "active" as const,
    started_at: new Date(now).toISOString(),
    ends_at: new Date(now + quest.duration_min * 60_000).toISOString(),
    members: [
      { user_id: mockUser.id, display_name: mockUser.display_name, submitted: false },
      { user_id: mockPartnerId, display_name: mockPartner.display_name, submitted: false },
    ],
    partnerSubmitAt: null,
  };
  state.runs.set(run.id, run);
  if (state.match) state.match.run_id = run.id;
  return publicRun(run);
}

export function getRun(id: string): QuestRun | null {
  const run = state.runs.get(id);
  if (!run) return null;
  if (run.partnerSubmitAt && Date.now() > run.partnerSubmitAt) run.members[1].submitted = true;
  if (run.members.every((m) => m.submitted)) run.status = "completed";
  else if (Date.now() > Date.parse(run.ends_at)) run.status = "expired";
  return publicRun(run);
}

export function submit(id: string, verdict: Verdict) {
  const run = state.runs.get(id);
  if (!run) return;
  if (verdict.status === "approved") {
    run.members[0].submitted = true;
    run.partnerSubmitAt ??= Date.now() + PARTNER_SUBMIT_MS;
  }
}

function publicMatch(m: NonNullable<State["match"]>): Match {
  const { id, status, source, partner, run_id, you_accepted, distance_m } = m;
  return { id, status, source, partner: status === "accepted" ? partner : null, run_id, you_accepted, distance_m };
}

function publicRun(r: QuestRun & { partnerSubmitAt: number | null }): QuestRun {
  const { id, quest, mode, status, started_at, ends_at, members } = r;
  return structuredClone({ id, quest, mode, status, started_at, ends_at, members });
}
