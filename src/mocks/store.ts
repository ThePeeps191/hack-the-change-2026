import "server-only";
import type { Match, Quest, QuestRun, Verdict } from "@/lib/contracts";
import { starterQuests } from "@/lib/starter-quests";
import { mockPartner, mockPartnerId, mockUser } from "./user";

// In-memory state for mock mode, so the System 1 flow is clickable end to end:
// free -> (4s) match found -> you accept -> (2s) partner accepts and the server
// creates the run -> submit proof -> verdict pending (2s) -> approved.
// Lives on globalThis so it survives hot reloads. One shared mock user.

const SEARCH_MS = 4000;
const PARTNER_ACCEPT_MS = 2000;
const VERDICT_MS = 2000;
const PARTNER_SUBMIT_MS = 6000;

type MockMatch = Match & { accepted_at: number | null };
type MockRun = QuestRun & {
  verdictAt: number | null;
  pendingVerdict: Verdict | null;
  partnerSubmitAt: number | null;
};

type State = { freeSince: number | null; match: MockMatch | null; runs: Map<string, MockRun> };

const g = globalThis as unknown as { __mockState?: State };
const state: State = (g.__mockState ??= { freeSince: null, match: null, runs: new Map() });

export function setFree(free: boolean) {
  state.freeSince = free ? Date.now() : null;
  state.match = null; // saying you're free (again) always starts a fresh search
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
      accepted_at: null,
    };
  }
  const m = state.match;
  if (m && m.status === "pending" && m.accepted_at && now - m.accepted_at > PARTNER_ACCEPT_MS) {
    m.status = "accepted";
    m.partner = mockPartner;
    m.run_id = startRun(pairQuest(), "pair").id;
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

// The demo's System 1 quest: the TFDL book hunt, else the first local quest.
function pairQuest(): Quest {
  const all = starterQuests();
  return all.find((q) => q.id === "a1b2c3d4-0001-4000-8000-000000000001") ?? all.find((q) => q.type === "local") ?? all[0];
}

export function acceptInvite(): Match {
  state.match = {
    id: crypto.randomUUID(),
    status: "accepted",
    source: "invite",
    partner: mockPartner,
    run_id: startRun(pairQuest(), "pair").id,
    you_accepted: true,
    distance_m: null,
    accepted_at: Date.now(),
  };
  return publicMatch(state.match);
}

export function startRun(quest: Quest, mode: QuestRun["mode"]): QuestRun {
  const now = Date.now();
  const run: MockRun = {
    id: crypto.randomUUID(),
    quest,
    mode,
    status: "active",
    started_at: new Date(now).toISOString(),
    ends_at: new Date(now + quest.duration_min * 60_000).toISOString(),
    members: [
      { user_id: mockUser.id, display_name: mockUser.display_name, submitted: false, verdict: null },
      { user_id: mockPartnerId, display_name: mockPartner.display_name, submitted: false, verdict: null },
    ],
    verdictAt: null,
    pendingVerdict: null,
    partnerSubmitAt: null,
  };
  state.runs.set(run.id, run);
  return publicRun(run);
}

export function getRun(id: string): QuestRun | null {
  const run = state.runs.get(id);
  if (!run) return null;
  const now = Date.now();
  const [you, partner] = run.members;
  if (run.verdictAt && now > run.verdictAt && run.pendingVerdict) {
    you.verdict = run.pendingVerdict;
    you.submitted = run.pendingVerdict.status === "approved";
    if (you.submitted) run.partnerSubmitAt ??= now + PARTNER_SUBMIT_MS;
    run.verdictAt = null;
    run.pendingVerdict = null;
  }
  if (run.partnerSubmitAt && now > run.partnerSubmitAt && !partner.submitted) {
    partner.submitted = true;
    partner.verdict = { status: "approved", reason: "looks right.", coins: run.quest.coins };
  }
  if (run.members.every((m) => m.submitted)) run.status = "completed";
  else if (now > Date.parse(run.ends_at)) run.status = "expired";
  return publicRun(run);
}

// Returns the pending verdict straight away; the final one shows up on the run.
export function submit(id: string, final: Verdict): Verdict | null {
  const run = state.runs.get(id);
  if (!run) return null;
  const pending: Verdict = { status: "pending", reason: "" };
  run.members[0].verdict = pending;
  run.pendingVerdict = final;
  run.verdictAt = Date.now() + VERDICT_MS;
  return pending;
}

function publicMatch(m: MockMatch): Match {
  const { id, status, source, partner, run_id, you_accepted, distance_m } = m;
  return { id, status, source, partner: status === "accepted" ? partner : null, run_id, you_accepted, distance_m };
}

function publicRun(r: MockRun): QuestRun {
  const { id, quest, mode, status, started_at, ends_at, members } = r;
  return structuredClone({ id, quest, mode, status, started_at, ends_at, members });
}
