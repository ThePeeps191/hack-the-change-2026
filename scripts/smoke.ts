// Runs the whole product over HTTP as several made-up people, against a dev
// server with mock login. Safe to repeat: every run uses fresh names.
//
//   PORT=3001 bun run dev        (in one terminal)
//   BASE_URL=http://localhost:3001 bun run smoke
import type { Crew, Dashboard, Game, LeaderboardEntry, Match, Quest, QuestRun, Recap, User, Verdict, Zone } from "../src/lib/contracts";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const tag = Math.random().toString(36).slice(2, 7);
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
const AT = { lat: 51.0777, lng: -114.1293 };

let failures = 0;
let checks = 0;

function check(ok: boolean, label: string, detail?: unknown) {
  checks++;
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${!ok && detail !== undefined ? `: ${JSON.stringify(detail)}` : ""}`);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Reply<T> = { status: number; data: T };

// Everyone this run creates, so they can be marked not-free at the end, even
// after a failure. Otherwise a crashed run leaves people "free" for 20 minutes
// and the next run's Sam gets matched with them.
const everyone: Record<string, string>[] = [];

function person(name?: string) {
  const headers: Record<string, string> = name ? { "x-amble-user": `${name}${tag}` } : {};
  everyone.push(headers);
  async function call<T>(method: string, path: string, body?: unknown): Promise<Reply<T>> {
    const isForm = body instanceof FormData;
    const res = await fetch(BASE + path, {
      method,
      headers: { ...headers, ...(body && !isForm ? { "content-type": "application/json" } : {}) },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, data: (text ? JSON.parse(text) : null) as T };
  }
  return {
    get: <T>(path: string) => call<T>("GET", path),
    post: <T>(path: string, body?: unknown) => call<T>("POST", path, body ?? {}),
    patch: <T>(path: string, body?: unknown) => call<T>("PATCH", path, body),
    del: <T>(path: string) => call<T>("DELETE", path),
    async proof(runId: string, extra: Record<string, string> = {}) {
      const form = new FormData();
      form.set("media", new File([PNG], "proof.png", { type: "image/png" }));
      form.set("lat", String(AT.lat));
      form.set("lng", String(AT.lng));
      form.set("taken_at", new Date().toISOString());
      for (const [k, v] of Object.entries(extra)) form.set(k, v);
      return call<Verdict>("POST", `/api/runs/${runId}/submissions`, form);
    },
  };
}

type Person = ReturnType<typeof person>;

async function poll<T>(fn: () => Promise<T>, done: (v: T) => boolean, ms = 12000) {
  const end = Date.now() + ms;
  let last = await fn();
  while (!done(last) && Date.now() < end) {
    await wait(300);
    last = await fn();
  }
  return last;
}

const mine = async (p: Person, id: string) => (await p.get<QuestRun>(`/api/runs/${id}`)).data;
const settled = async (p: Person, id: string) =>
  poll(() => mine(p, id), (r) => !!r.members?.[0]?.verdict && r.members[0].verdict.status !== "pending");

async function pairUp(a: Person, b: Person) {
  await a.post("/api/availability", AT);
  await b.post("/api/availability", AT);
  const ma = (await a.get<Match>("/api/match")).data;
  const mb = (await b.get<Match>("/api/match")).data;
  return { ma, mb };
}

async function main() {
  const health = await person().get<{ ok: boolean; database: string; auth_mode: string }>("/api/health");
  console.log(`\n${BASE}: ${health.data.database} database, ${health.data.auth_mode} login\n`);
  check(health.data.ok === true, "health responds");

  console.log("\nsolo, with the bot partner");
  const sam = person();
  await sam.del("/api/availability");
  const before = (await sam.get<User>("/api/me")).data;
  check(before.display_name === "Sam", "default user is Sam");
  check((await sam.get<{ free: boolean }>("/api/availability")).data.free === false, "not looking until you say you're free");
  // "Find someone to do it with" on one quest: the match gets that quest.
  const picked = (await sam.get<Quest[]>("/api/quests")).data.filter((q) => q.type !== "anywhere").at(-1)!;
  await sam.post("/api/availability", { ...AT, quest_id: picked.id });
  check((await sam.get<{ free: boolean }>("/api/availability")).data.free === true, "looking after I'm free");
  check((await sam.get<Match | null>("/api/match")).data === null, "searching at first");
  const found = await poll(async () => (await sam.get<Match | null>("/api/match")).data, (m) => !!m);
  check(found?.status === "pending" && found.partner === null, "bot match appears, partner hidden until both accept", found);
  check(typeof found?.distance_m === "number", "shows distance only");
  const accepted = await sam.post<Match>(`/api/matches/${found!.id}/accept`);
  check(accepted.data.you_accepted === true && accepted.data.status === "pending", "waiting for them after accepting");
  const ready = await poll(async () => (await sam.get<Match>("/api/match")).data, (m) => m.status === "accepted");
  check(ready.status === "accepted" && !!ready.run_id && ready.partner?.display_name === "Priya", "accepted arrives with a run and a name", ready);
  const runId = ready.run_id!;
  const run = await mine(sam, runId);
  check(run.members[0].display_name === "Sam", "caller is members[0]");
  check(run.quest.id === picked.id, "the match uses the quest you picked", run.quest.title);
  check(run.mode === "pair" && run.status === "active", "pair run is active");
  check((await sam.get<QuestRun>("/api/runs/current")).data?.id === runId, "current run finds it");

  const rejected = await sam.proof(runId, { mock_verdict: "rejected" });
  check(rejected.data.status === "pending", "proof returns pending straight away", rejected);
  const r1 = await settled(sam, runId);
  check(r1.members[0].verdict?.status === "rejected" && !r1.members[0].submitted, "rejected proof comes back with a reason", r1.members[0]);
  // With DEMO_MODE on, the presenter can overturn a wrong "no" by hand instead.
  const demo = (await sam.get<{ demo_mode: boolean }>("/api/health")).data.demo_mode;
  if (demo) check((await sam.post<{ approved: number }>(`/api/runs/${runId}/approve`)).data.approved === 1, "a rejected proof can be approved by hand");
  else await sam.proof(runId);
  const r2 = await settled(sam, runId);
  check(r2.members[0].verdict?.status === "approved" && r2.members[0].submitted, "approved on retry");
  check(r2.members[0].verdict?.coins === run.quest.coins, "verdict shows the coins");
  const done = await poll(() => mine(sam, runId), (r) => r.status === "completed", 15000);
  check(done.status === "completed", "bot submits and the run completes", done.status);
  const recap = await sam.get<Recap>(`/api/runs/${runId}/recap`);
  check(recap.status === 200 && !!recap.data.summary && recap.data.partner?.display_name === "Priya", "recap is written", recap);
  check(recap.data.photos.length === 1, "recap has the verified photo", recap.data.photos);
  check(recap.data.coins === run.quest.coins, "recap shows coins earned");
  const media = await fetch(BASE + recap.data.photos[0]);
  check(media.status === 200 && media.headers.get("content-type") === "image/png", "photo is served");
  check((await sam.post<{ connected: boolean }>("/api/connections", { run_id: runId })).data.connected, "bot opts in, so you connect");
  const after = (await sam.get<User>("/api/me")).data;
  check(after.coins === before.coins + run.quest.coins, "coins were paid exactly once", { before: before.coins, after: after.coins });

  console.log("\ntwo real people");
  const alice = person("alice");
  const bob = person("bob");
  const { ma, mb } = await pairUp(alice, bob);
  check(!!ma?.id && ma.id === mb?.id, "two free people are paired", { ma, mb });
  const raced = await Promise.all([alice.post<Match>(`/api/matches/${ma.id}/accept`), bob.post<Match>(`/api/matches/${ma.id}/accept`)]);
  const finalA = (await alice.get<Match>("/api/match")).data;
  const finalB = (await bob.get<Match>("/api/match")).data;
  check(raced.every((r) => r.status === 200), "both accept at the same moment");
  check(finalA.status === "accepted" && finalA.run_id === finalB.run_id, "exactly one run from the race", { finalA, finalB });
  const pairRun = finalA.run_id!;
  check((await mine(alice, pairRun)).members[0].user_id !== (await mine(bob, pairRun)).members[0].user_id, "each person sees themselves first");
  const outsider = person("eve");
  check((await outsider.get(`/api/runs/${pairRun}`)).status === 404, "a stranger can't read the run");
  check((await outsider.get("/api/runs/not-a-uuid")).status === 404, "a bad id is a 404, not a crash");
  await alice.post("/api/location", { run_id: pairRun, points: [
    { ...AT, at: new Date(Date.now() - 60_000).toISOString() },
    { lat: AT.lat + 0.001, lng: AT.lng, at: new Date().toISOString() },
  ] });
  check((await alice.post(`/api/runs/${pairRun}/checkins`, { phase: "before", mood: 2 })).status === 204, "mood check-in saved");
  check((await alice.post(`/api/runs/${pairRun}/checkins`, { phase: "before", mood: 9 })).status === 400, "bad mood refused");
  await alice.post(`/api/runs/${pairRun}/checkins`, { phase: "after", mood: 4 });
  await alice.proof(pairRun);
  await settled(alice, pairRun);
  check((await mine(alice, pairRun)).status === "active", "still active until both are approved");
  await bob.proof(pairRun);
  await settled(bob, pairRun);
  const pairDone = await poll(() => mine(bob, pairRun), (r) => r.status === "completed");
  check(pairDone.status === "completed", "completes once both are approved");
  check((await alice.get<Recap>(`/api/runs/${pairRun}/recap`)).data.distance_m! > 50, "walked distance comes from pings");
  check((await alice.post<{ connected: boolean }>("/api/connections", { run_id: pairRun })).data.connected === false, "one yes doesn't connect");
  check((await bob.post<{ connected: boolean }>("/api/connections", { run_id: pairRun })).data.connected === true, "two yeses connect");
  check((await alice.get<unknown[]>("/api/connections")).data.length === 1, "connection is listed");
  check((await alice.get<Match | null>("/api/match")).data === null, "a finished quest isn't a current match");

  console.log("\ndeclining and reporting");
  const carol = person("carol");
  const dan = person("dan");
  const pc = await pairUp(carol, dan);
  await carol.post(`/api/matches/${pc.ma.id}/decline`);
  check((await dan.get<Match>("/api/match")).data?.status === "declined", "the other person sees it end");
  await carol.post("/api/availability", AT);
  await dan.post("/api/availability", AT);
  check((await dan.get<Match | null>("/api/match")).data === null, "just-declined people aren't re-paired");
  await carol.del("/api/availability");
  await dan.del("/api/availability");

  const fay = person("fay");
  const gus = person("gus");
  const pf = await pairUp(fay, gus);
  await fay.post(`/api/matches/${pf.ma.id}/accept`);
  await gus.post(`/api/matches/${pf.ma.id}/accept`);
  const fayMatch = (await fay.get<Match>("/api/match")).data;
  const fayRun = await mine(fay, fayMatch.run_id!);
  await fay.post("/api/reports", { reported_id: fayRun.members[1].user_id, run_id: fayRun.id, reason: "something else" });
  check((await mine(gus, fayRun.id)).status === "expired", "a report ends the quest");
  await fay.post("/api/availability", AT);
  await gus.post("/api/availability", AT);
  check((await gus.get<Match | null>("/api/match")).data === null, "reported pairs are never matched again");
  await fay.del("/api/availability");
  await gus.del("/api/availability");

  console.log("\ncomfort settings steer matching");
  const quietA = person("quieta");
  const chattyB = person("chattyb");
  const quietC = person("quietc");
  await quietA.patch("/api/me", { prefs: { social: "side-by-side" } });
  await chattyB.patch("/api/me", { prefs: { social: "chatty" } });
  await quietC.patch("/api/me", { prefs: { social: "side-by-side" } });
  // B and C are 2.3 km apart, too far to pair with each other, so A chooses.
  await chattyB.post("/api/availability", { lat: AT.lat, lng: AT.lng - 0.01428 }); // 1.0 km west, wants to chat
  await quietC.post("/api/availability", { lat: AT.lat, lng: AT.lng + 0.01857 }); // 1.3 km east, side by side
  check((await chattyB.get<Match | null>("/api/match")).data === null, "people out of range of each other stay unpaired");
  await quietA.post("/api/availability", AT);
  const fitA = (await quietA.get<Match>("/api/match")).data;
  const fitC = (await quietC.get<Match>("/api/match")).data;
  check(!!fitA && fitA.id === fitC?.id, "a similar person a bit further away beats a mismatch nearer by", { fitA, fitC });
  await chattyB.del("/api/availability");
  await quietA.post(`/api/matches/${fitA.id}/decline`);

  console.log("\ninvite link");
  const hana = person("hana");
  const ivan = person("ivan");
  const invite = await hana.post<{ code: string; url: string }>("/api/invites");
  check(invite.data.url.endsWith(`/invite/${invite.data.code}`), "invite has a link", invite);
  check((await hana.post(`/api/invites/${invite.data.code}/accept`)).status === 400, "can't accept your own invite");
  const viaLink = await ivan.post<Match>(`/api/invites/${invite.data.code}/accept`, AT);
  check(viaLink.data.status === "accepted" && !!viaLink.data.run_id, "accepting starts the quest", viaLink);
  check((await person("jay").post(`/api/invites/${invite.data.code}/accept`)).status === 410, "an invite only works once");
  check((await hana.get<Match>("/api/match")).data.run_id === viaLink.data.run_id, "the inviter gets the same quest");

  console.log("\ncrews");
  const kim = person("kim");
  const lee = person("lee");
  check((await kim.post("/api/crews", { name: "  " })).status === 400, "a crew needs a name");
  const crew = (await kim.post<Crew>("/api/crews", { name: `crew ${tag}` })).data;
  check(crew.members.length === 1 && !!crew.invite_code, "crew created");
  check((await lee.get(`/api/crews/${crew.id}`)).status === 404, "non-members can't read a crew");
  check((await lee.post("/api/crews/join", { invite_code: "NOPE" })).status === 404, "a wrong code is refused");
  check((await lee.post<Crew>("/api/crews/join", { invite_code: crew.invite_code.toLowerCase() })).data.members.length === 2, "joined with the code");
  const anywhere = (await kim.get<Quest[]>("/api/quests?type=anywhere")).data;
  check(anywhere.every((q) => q.type === "anywhere"), "the anywhere filter only lists anywhere quests");
  const photoQuest = (await kim.get<Quest[]>("/api/quests")).data.find((q) => q.proof === "photo")!;
  check((await kim.post(`/api/crews/${crew.id}/quests`, { quest_id: photoQuest.id })).status === 204, "quest shared with the crew");
  check((await lee.get<Crew>(`/api/crews/${crew.id}`)).data.shared_quests.some((q) => q.id === photoQuest.id), "crewmates see it");
  const crewRun = (await kim.post<QuestRun>("/api/runs", { quest_id: photoQuest.id, crew_id: crew.id })).data;
  const sameRun = (await lee.post<QuestRun>("/api/runs", { quest_id: photoQuest.id, crew_id: crew.id })).data;
  check(crewRun.id === sameRun.id && sameRun.members.length === 2, "friends land on the same run", sameRun);
  check((await person("mo").post("/api/runs", { quest_id: photoQuest.id, crew_id: crew.id })).status === 403, "non-members can't start crew quests");
  await kim.proof(crewRun.id);
  await lee.proof(crewRun.id);
  await settled(kim, crewRun.id);
  await settled(lee, crewRun.id);
  check((await poll(() => mine(kim, crewRun.id), (r) => r.status === "completed")).status === "completed", "crew run completes");
  const board = (await kim.get<LeaderboardEntry[]>("/api/leaderboard")).data;
  const entry = board.find((e) => e.id === crew.id);
  check(entry?.coins === photoQuest.coins * 2, "both members' coins reach the leaderboard", entry);
  check(entry?.delta === photoQuest.coins * 2, "recent coins show as delta", entry);
  const members = (await kim.get<LeaderboardEntry[]>(`/api/leaderboard?crew_id=${crew.id}`)).data;
  check(members.length === 2, "crew ranking lists members");

  // A crew quest stays open for late crewmates, and starting one shares it.
  const late = (await kim.post<Crew>("/api/crews", { name: `late ${tag}` })).data;
  await lee.post("/api/crews/join", { invite_code: late.invite_code });
  const [lateQuest, soloQuest] = (await kim.get<Quest[]>("/api/quests")).data.filter((q) => q.proof === "photo");
  const lateRun = (await kim.post<QuestRun>("/api/runs", { quest_id: lateQuest.id, crew_id: late.id })).data;
  check((await lee.get<Crew>(`/api/crews/${late.id}`)).data.shared_quests.some((q) => q.id === lateQuest.id), "starting a crew quest shares it with the crew");
  await kim.proof(lateRun.id);
  await settled(kim, lateRun.id);
  check((await mine(kim, lateRun.id)).status === "active", "a crew run stays open after the first approval");
  const lateJoin = (await lee.post<QuestRun>("/api/runs", { quest_id: lateQuest.id, crew_id: late.id })).data;
  check(lateJoin.id === lateRun.id && lateJoin.members.length === 2, "a late crewmate joins the same run", lateJoin.id);
  await lee.proof(lateRun.id);
  await settled(lee, lateRun.id);
  check((await poll(() => mine(kim, lateRun.id), (r) => r.status === "completed")).status === "completed", "it completes once the late crewmate is done");
  const alone = (await kim.post<QuestRun>("/api/runs", { quest_id: soloQuest.id, crew_id: late.id })).data;
  check((await kim.post(`/api/runs/${alone.id}/finish`)).status === 409, "finish now needs your proof first");
  await kim.proof(alone.id);
  await settled(kim, alone.id);
  check((await kim.post<QuestRun>(`/api/runs/${alone.id}/finish`)).data.status === "completed", "finish now ends a crew quest without waiting");

  console.log("\nclaim");
  const noa = person("noa");
  const rival = (await noa.post<Crew>("/api/crews", { name: `rivals ${tag}` })).data;
  const noGame = await person("pat").get("/api/games/current");
  check(noGame.status === 404, "no game yet is a clean 404");
  const game = (await kim.post<Game>("/api/games", { rival_code: rival.invite_code })).data;
  check(game.zones.length === 5 && game.teams.length === 2, "game has zones and two teams", { z: game.zones.length, t: game.teams.length });
  check((await noa.get<Game>("/api/games/current")).data.teams[0].crew_id === rival.id, "each team sees itself first");
  // TFDL: a photo challenge right by AT, scored in years where the earliest wins.
  const zone = game.zones.find((z) => z.result_unit === "year" && z.lower_is_better)!;
  async function play(p: Person, result: number) {
    const started = (await p.post<QuestRun>("/api/runs", { quest_id: zone.quest_id, zone_id: zone.id })).data;
    await p.proof(started.id);
    await settled(p, started.id);
    return p.post<Zone>(`/api/games/${game.id}/zones/${zone.id}/attempts`, { run_id: started.id, result });
  }
  const noProof = (await kim.post<QuestRun>("/api/runs", { quest_id: zone.quest_id, zone_id: zone.id })).data;
  check((await kim.post(`/api/games/${game.id}/zones/${zone.id}/attempts`, { run_id: noProof.id, result: 1950 })).status === 409, "no claim without approved proof");
  await kim.proof(noProof.id);
  await settled(kim, noProof.id);
  const first = await kim.post<Zone>(`/api/games/${game.id}/zones/${zone.id}/attempts`, { run_id: noProof.id, result: 1950 });
  const kimTeam = game.teams[0].id;
  check(first.data.held_by_team_id === kimTeam && first.data.best_result === 1950, "an empty zone is claimed", first);
  const repeat = await kim.post(`/api/games/${game.id}/zones/${zone.id}/attempts`, { run_id: noProof.id, result: 1900 });
  check(repeat.status === 409, "a run only counts once");
  const lost = await play(noa, 1990);
  check(lost.data.held_by_team_id === kimTeam, "a worse result doesn't steal it", lost);
  const stolen = await play(noa, 1900);
  check(stolen.data.held_by_team_id !== kimTeam && stolen.data.best_result === 1900, "a better result steals it", stolen);
  const ratedUp = (await noa.get<Crew>(`/api/crews/${rival.id}`)).data.rating!;
  check(ratedUp > 1500, "stealing lifts the rating", ratedUp);

  console.log("\nthings the review caught");
  const photo = await fetch(BASE + recap.data.photos[0]);
  check(photo.headers.get("x-content-type-options") === "nosniff", "media is served with nosniff");
  const raceCrew = (await kim.post<Crew>("/api/crews", { name: `race ${tag}` })).data;
  await lee.post("/api/crews/join", { invite_code: raceCrew.invite_code });
  // Any quest works for this check, so a missing anywhere quest fails one line above, not the whole run.
  const raceQuest = anywhere[0] ?? (await kim.get<Quest[]>("/api/quests")).data[0];
  const both = await Promise.all([kim, lee].map((p) => p.post<QuestRun>("/api/runs", { quest_id: raceQuest.id, crew_id: raceCrew.id })));
  check(both[0].data.id === both[1].data.id, "crewmates tapping at once share one run", both.map((b) => b.data.id));
  const ola = person("ola");
  const pip = person("pip");
  const op = await pairUp(ola, pip);
  await Promise.all([ola.post(`/api/matches/${op.ma.id}/accept`), pip.post(`/api/matches/${op.ma.id}/accept`)]);
  const opRun = (await ola.get<Match>("/api/match")).data.run_id!;
  const html = new FormData();
  html.set("media", new File(["<script>alert(1)</script>"], "x.html", { type: "constructor" }));
  const sneaky = await fetch(`${BASE}/api/runs/${opRun}/submissions`, { method: "POST", headers: { "x-amble-user": `ola${tag}` }, body: html });
  check(sneaky.status === 415, "a fake media type is refused", sneaky.status);
  await ola.proof(opRun);
  await pip.proof(opRun);
  await settled(ola, opRun);
  await settled(pip, opRun);
  await poll(() => mine(ola, opRun), (r) => r.status === "completed");
  const yeses = await Promise.all([ola, pip].map((p) => p.post<{ connected: boolean }>("/api/connections", { run_id: opRun })));
  check(yeses.some((y) => y.data.connected), "two yeses at the same moment still connect", yeses.map((y) => y.data));
  const claimMate = person("quin");
  await claimMate.post("/api/crews/join", { invite_code: rival.invite_code });
  const mateRun = (await noa.post<QuestRun>("/api/runs", { quest_id: zone.quest_id, zone_id: zone.id })).data;
  const joined = (await claimMate.post<QuestRun>("/api/runs", { quest_id: zone.quest_id, zone_id: zone.id })).data;
  check(joined.id === mateRun.id && joined.members.length === 2, "a claim teammate joins the open challenge", joined);
  const again = (await kim.post<Game>("/api/games", { rival_code: rival.invite_code })).data;
  const old = (await kim.get<Game>(`/api/games/${game.id}`)).data;
  check(again.id !== game.id && old.status === "finished" && (await kim.get<Game>("/api/games/current")).data.id === again.id, "a new game ends the crew's old one", { old: old.status });

  console.log("\ndashboard and privacy");
  const dash = (await alice.get<Dashboard>("/api/dashboard")).data;
  check(dash.quests_done === 1 && dash.people_met === 1 && dash.small_hellos?.length === 1, "dashboard counts real quests", dash);
  check(dash.active_minutes_week! >= 0 && dash.active_goal_minutes === 150, "weekly minutes against the guideline");
  check(dash.mood?.checkins === 1 && dash.mood.after_better === 1, "mood before and after are compared", dash.mood);
  check(dash.new_places?.length === 1 && !!dash.new_places[0].first_visit, "new places have a first visit", dash.new_places);
  const seeded = (await sam.get<Dashboard>("/api/dashboard")).data;
  check(!!seeded.familiar_faces?.some((f) => f.display_name === "Jo" && f.quests_together >= 2 && f.minutes_together > 0), "repeat partners are familiar faces", seeded.familiar_faces);
  const prefs = await alice.patch<User>("/api/me", { prefs: { pace: "short", step_free: true, social: "side-by-side", language: "fr", junk: 1 } });
  check(prefs.data.prefs.pace === "short" && prefs.data.prefs.step_free === true && !("junk" in prefs.data.prefs), "comfort settings saved and cleaned", prefs.data.prefs);
  const exported = (await alice.get<{ location_pings: unknown[]; runs: unknown[] }>("/api/me/export")).data;
  check(exported.location_pings.length === 2 && exported.runs.length === 1, "export includes your data");
  const gone = await alice.del("/api/me");
  check(gone.status === 204, "delete my data works");
  const fresh = (await alice.get<User>("/api/me")).data;
  check(fresh.coins === 0, "signing back in starts a fresh account", fresh);
  check((await bob.get<unknown[]>("/api/connections")).data.length === 0, "connections are removed for the other person too");
  check((await mine(bob, pairRun)).members.some((m) => m.display_name === "someone"), "a partner's history stays, without the name");

  console.log(`\n${checks - failures}/${checks} checks passed\n`);
}

async function cleanUp() {
  await Promise.all(everyone.map((headers) => fetch(`${BASE}/api/availability`, { method: "DELETE", headers }).catch(() => {})));
}

main()
  .catch((e) => {
    console.error(e);
    failures++;
  })
  .finally(async () => {
    await cleanUp();
    process.exit(failures ? 1 : 0);
  });
