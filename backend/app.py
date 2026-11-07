"""Amble Flask backend: every API endpoint from docs/CONTRACTS.md in one file.

Run:  cd backend && pip install -r requirements.txt && PORT=5001 python app.py

State lives in memory (restarting clears it), so dev needs no database.
AUTH_MODE=mock: you are whoever the `X-User` header, `?as=` query or `amble_user`
cookie names (default "demo"), so two tabs can be two people.
GEMINI_MODE=mock: quests come from the starter pack and proof is approved.
DEMO_MODE=1: a bot partner accepts straight away when you say you're free.
"""

import glob
import json
import math
import os
import random
import secrets
import string
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, g, jsonify, request

AUTH_MODE = os.environ.get("AUTH_MODE", "mock")
GEMINI_MODE = os.environ.get("GEMINI_MODE", "mock")
DEMO_MODE = bool(os.environ.get("DEMO_MODE"))
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000")

ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = ROOT / "uploads"

MATCH_RADIUS_M = 2000
AVAILABILITY_MIN = 20
MATCH_EXPIRY_MIN = 2

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
lock = threading.RLock()


# ---------------------------------------------------------------- helpers

def now():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z") if dt else None


def new_id():
    return str(uuid.uuid4())


def code(n=6):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


def err(message, status=400):
    return jsonify({"error": message}), status


def body():
    return request.get_json(silent=True) or {}


def distance_m(lat1, lng1, lat2, lng2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- store

users = {}          # id -> user
availability = {}   # user_id -> {lat, lng, expires_at}
matches = {}        # id -> match row
quests = {}         # id -> Quest
runs = {}           # id -> run row
submissions = {}    # id -> submission row
pings = []          # {time, user_id, run_id, lat, lng}
connections = {}    # run_id -> set of user_ids who opted in
connected = set()   # frozenset({a, b})
reports = []
crews = {}          # id -> {id, name, invite_code, created_by, created_at, members: {uid: joined_at}, quest_ids}
coin_events = []    # {id, user_id, crew_id, run_id, amount, created_at}
games = {}          # id -> {id, name, status, created_by, created_at, teams, zones}

FALLBACK_QUESTS = [
    {
        "title": "Find the tallest tree you can",
        "description": "Walk until you find the tallest tree nearby. Take a photo of both of you next to it.",
        "type": "anywhere", "lat": None, "lng": None, "radius_m": None,
        "duration_min": 20, "proof": "photo", "coins": 20, "place_name": None, "sources": [],
    },
    {
        "title": "A colour you both like",
        "description": "Agree on a colour, then find something outside in exactly that colour and photograph it.",
        "type": "anywhere", "lat": None, "lng": None, "radius_m": None,
        "duration_min": 20, "proof": "photo", "coins": 20, "place_name": None, "sources": [],
    },
]


def load_starter_quests():
    files = glob.glob(str(ROOT / "data" / "quests" / "*.json"))
    loaded = []
    for f in files:
        try:
            with open(f, encoding="utf-8") as fh:
                loaded.extend(json.load(fh))
        except (OSError, ValueError):
            pass
    for q in loaded or FALLBACK_QUESTS:
        q = dict(q)
        q.setdefault("id", new_id())
        q.setdefault("sources", [])
        q["created_at"] = iso(now())
        quests[q["id"]] = q


load_starter_quests()


# ---------------------------------------------------------------- auth

def get_or_create_user(key, display_name=None):
    u = users.get(key)
    if not u:
        u = {
            "id": key,
            "auth0_sub": f"mock|{key}",
            "display_name": display_name or key.capitalize(),
            "avatar_url": None,
            "email_verified": True,
            "age_confirmed_at": None,
            "coins": 0,
            "created_at": iso(now()),
        }
        users[key] = u
    return u


@app.before_request
def load_user():
    g.user = None
    if not request.path.startswith("/api/"):
        return
    if AUTH_MODE == "mock":
        key = (request.headers.get("X-User") or request.args.get("as")
               or request.cookies.get("amble_user") or "demo")
        g.user = get_or_create_user(key)
    else:
        # Live Auth0 session lookup goes here.
        return err("not signed in", 401)


@app.after_request
def cors(resp):
    origin = request.headers.get("Origin")
    if origin:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-User"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def preflight(_any):
    return "", 204


def me():
    return g.user


def public_user(uid):
    u = users.get(uid) or {}
    return {"user_id": uid, "display_name": u.get("display_name", "Someone"),
            "avatar_url": u.get("avatar_url")}


# ---------------------------------------------------------------- gemini (behind plain functions)

def generate_quests(lat, lng, count=3):
    """Gemini writes quests near (lat, lng). Mock/fallback: nearest starter quests."""
    # Live Gemini call with Maps grounding goes here; fall back to starter pack on failure.
    pool = list(quests.values())

    def rank(q):
        if q["lat"] is None or lat is None:
            return 10_000_000
        return distance_m(lat, lng, q["lat"], q["lng"])

    pool.sort(key=rank)
    return pool[:count]


def referee(run, sub):
    """Gemini checks the proof. Mock: approve if location and time pass."""
    q = run["quest"]
    started = datetime.fromisoformat(run["started_at"].replace("Z", "+00:00"))
    ends = datetime.fromisoformat(run["ends_at"].replace("Z", "+00:00"))
    taken = sub["taken_at_dt"]
    if not DEMO_MODE:
        if taken and not (started - timedelta(minutes=1) <= taken <= ends + timedelta(minutes=5)):
            return "rejected", "That photo was taken outside the quest window."
        if q["lat"] is not None and sub["lat"] is not None:
            d = distance_m(q["lat"], q["lng"], sub["lat"], sub["lng"])
            if d > (q["radius_m"] or 100) + 50:
                return "rejected", f"You look about {int(d)} m from {q['place_name'] or 'the spot'}."
    # Live Gemini vision call goes here.
    return "approved", "Looks great. Quest complete!"


def make_recap_summary(run):
    names = " and ".join(m["display_name"] for m in run_members(run))
    return f"{names} completed \"{run['quest']['title']}\"."


# ---------------------------------------------------------------- runs

def create_run(quest, mode, member_ids, match_id=None, crew_id=None, zone_id=None):
    start = now()
    run = {
        "id": new_id(), "quest": quest, "mode": mode, "status": "active",
        "started_at": iso(start),
        "ends_at": iso(start + timedelta(minutes=quest["duration_min"] or 20)),
        "member_ids": list(member_ids),
        "match_id": match_id, "crew_id": crew_id, "zone_id": zone_id,
        "recap": None,
    }
    runs[run["id"]] = run
    return run


def latest_submission(run_id, uid):
    subs = [s for s in submissions.values() if s["run_id"] == run_id and s["user_id"] == uid]
    return subs[-1] if subs else None


def run_members(run):
    out = []
    for uid in run["member_ids"]:
        s = latest_submission(run["id"], uid)
        out.append({
            **{k: v for k, v in public_user(uid).items() if k != "avatar_url"},
            "submitted": s is not None,
            "verdict": {"status": s["verdict"], "reason": s["reason"]} if s else None,
        })
    return out


def refresh_run(run):
    if run["status"] != "active":
        return
    members = run_members(run)
    if all(m["verdict"] and m["verdict"]["status"] == "approved" for m in members):
        finish_run(run)
    elif now() > datetime.fromisoformat(run["ends_at"].replace("Z", "+00:00")) + timedelta(minutes=5):
        run["status"] = "expired"


def finish_run(run):
    run["status"] = "completed"
    amount = run["quest"].get("coins", 0)
    for uid in run["member_ids"]:
        u = users.get(uid)
        if u:
            u["coins"] += amount
        coin_events.append({"id": new_id(), "user_id": uid, "crew_id": run["crew_id"],
                            "run_id": run["id"], "amount": amount, "created_at": iso(now())})
    run["recap"] = {"summary": make_recap_summary(run), "narration_url": None, "created_at": iso(now())}


def run_json(run):
    refresh_run(run)
    return {k: run[k] for k in ("id", "quest", "mode", "status", "started_at", "ends_at")} | {
        "members": run_members(run)}


# ---------------------------------------------------------------- matching

def other(m, uid):
    return m["user_b"] if m["user_a"] == uid else m["user_a"]


def match_json(m, uid):
    partner = None
    if m["status"] == "accepted" and other(m, uid):
        p = public_user(other(m, uid))
        partner = {"display_name": p["display_name"], "avatar_url": p["avatar_url"]}
    return {"id": m["id"], "status": m["status"], "source": m["source"],
            "partner": partner, "run_id": m["run_id"]}


def expire_matches():
    for m in matches.values():
        if m["status"] == "pending" and m["user_b"] and now() > m["expires_at"]:
            m["status"] = "expired"


def open_match_for(uid):
    for m in sorted(matches.values(), key=lambda x: x["created_at"], reverse=True):
        if uid in (m["user_a"], m["user_b"]) and m["status"] in ("pending", "accepted"):
            if m["status"] == "accepted" and m["run_id"] and runs[m["run_id"]]["status"] != "active":
                continue
            return m
    return None


def new_match(a, b, source, invite_code=None):
    m = {"id": new_id(), "user_a": a, "user_b": b, "status": "pending", "source": source,
         "invite_code": invite_code, "accepted_by": set(), "run_id": None,
         "created_at": now(), "expires_at": now() + timedelta(minutes=MATCH_EXPIRY_MIN)}
    matches[m["id"]] = m
    return m


def try_pair(uid):
    mine = availability.get(uid)
    if not mine or open_match_for(uid):
        return
    for other_id, a in availability.items():
        if other_id == uid or a["expires_at"] < now() or open_match_for(other_id):
            continue
        if distance_m(mine["lat"], mine["lng"], a["lat"], a["lng"]) <= MATCH_RADIUS_M:
            new_match(uid, other_id, "nearby")
            availability.pop(uid, None)
            availability.pop(other_id, None)
            return


def start_pair_run(m):
    a = availability.get(m["user_a"]) or {}
    q = generate_quests(a.get("lat") or m.get("lat"), a.get("lng") or m.get("lng"), 1)[0]
    run = create_run(q, "pair", [m["user_a"], m["user_b"]], match_id=m["id"])
    m["run_id"] = run["id"]


# ================================================================ ENDPOINTS

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "auth_mode": AUTH_MODE, "gemini_mode": GEMINI_MODE, "demo_mode": DEMO_MODE})


# ---- me

@app.get("/api/me")
def get_me():
    return jsonify(me())


@app.patch("/api/me")
def patch_me():
    b = body()
    u = me()
    with lock:
        if "display_name" in b and str(b["display_name"]).strip():
            u["display_name"] = str(b["display_name"]).strip()[:40]
        if "avatar_url" in b:
            u["avatar_url"] = b["avatar_url"]
        if b.get("age_confirmed"):
            u["age_confirmed_at"] = u["age_confirmed_at"] or iso(now())
    return jsonify(u)


# ---- availability and matching

@app.post("/api/availability")
def post_availability():
    b = body()
    lat, lng = num(b.get("lat")), num(b.get("lng"))
    if lat is None or lng is None:
        return err("lat and lng are required")
    uid = me()["id"]
    expires = now() + timedelta(minutes=AVAILABILITY_MIN)
    with lock:
        availability[uid] = {"lat": lat, "lng": lng, "expires_at": expires}
        if DEMO_MODE and not open_match_for(uid):
            bot = get_or_create_user("bot", "Robin (demo)")
            m = new_match(uid, bot["id"], "nearby")
            m["accepted_by"].add(bot["id"])
            m["lat"], m["lng"] = lat, lng
            availability.pop(uid, None)
        else:
            try_pair(uid)
    return jsonify({"expires_at": iso(expires)})


@app.delete("/api/availability")
def delete_availability():
    with lock:
        availability.pop(me()["id"], None)
    return "", 204


@app.get("/api/match")
def get_match():
    uid = me()["id"]
    with lock:
        expire_matches()
        try_pair(uid)
        m = open_match_for(uid)
        return jsonify(match_json(m, uid) if m else None)


@app.post("/api/matches/<mid>/accept")
def accept_match(mid):
    uid = me()["id"]
    with lock:
        m = matches.get(mid)
        if not m or uid not in (m["user_a"], m["user_b"]):
            return err("match not found", 404)
        if m["status"] != "pending":
            return jsonify(match_json(m, uid))
        m["accepted_by"].add(uid)
        if m["user_b"] and {m["user_a"], m["user_b"]} <= m["accepted_by"]:
            m["status"] = "accepted"
            start_pair_run(m)
        return jsonify(match_json(m, uid))


@app.post("/api/matches/<mid>/decline")
def decline_match(mid):
    uid = me()["id"]
    with lock:
        m = matches.get(mid)
        if not m or uid not in (m["user_a"], m["user_b"]):
            return err("match not found", 404)
        if m["status"] == "pending":
            m["status"] = "declined"
        return jsonify(match_json(m, uid))


@app.post("/api/invites")
def create_invite():
    uid = me()["id"]
    b = body()
    with lock:
        c = code()
        m = new_match(uid, None, "invite", invite_code=c)
        m["accepted_by"].add(uid)
        m["lat"], m["lng"] = num(b.get("lat")), num(b.get("lng"))
    return jsonify({"code": c, "url": f"{APP_BASE_URL}/invite/{c}"})


@app.post("/api/invites/<c>/accept")
def accept_invite(c):
    uid = me()["id"]
    with lock:
        m = next((x for x in matches.values() if x["invite_code"] == c.upper()), None)
        if not m or m["status"] != "pending":
            return err("invite not found or already used", 404)
        if m["user_a"] == uid:
            return err("you can't accept your own invite")
        m["user_b"] = uid
        m["accepted_by"].add(uid)
        m["status"] = "accepted"
        start_pair_run(m)
        return jsonify(match_json(m, uid))


# ---- quests

@app.post("/api/quests/generate")
def post_generate():
    b = body()
    lat, lng = num(b.get("lat")), num(b.get("lng"))
    if lat is None or lng is None:
        return err("lat and lng are required")
    count = max(1, min(int(b.get("count") or 3), 10))
    return jsonify(generate_quests(lat, lng, count))


@app.get("/api/quests")
def list_quests():
    t = request.args.get("type")
    return jsonify([q for q in quests.values() if not t or q["type"] == t])


@app.get("/api/quests/<qid>")
def get_quest(qid):
    q = quests.get(qid)
    return jsonify(q) if q else err("quest not found", 404)


# ---- runs

@app.post("/api/runs")
def post_run():
    b = body()
    uid = me()["id"]
    with lock:
        q = quests.get(b.get("quest_id"))
        if not q:
            return err("quest not found", 404)
        crew_id, zone_id = b.get("crew_id"), b.get("zone_id")
        if crew_id:
            crew = crews.get(crew_id)
            if not crew or uid not in crew["members"]:
                return err("crew not found", 404)
            member_ids = list(crew["members"])
        else:
            member_ids = [uid]
        mode = "claim" if zone_id else "crew"
        return jsonify(run_json(create_run(q, mode, member_ids, crew_id=crew_id, zone_id=zone_id)))


@app.get("/api/runs/<rid>")
def get_run(rid):
    with lock:
        run = runs.get(rid)
        if not run or me()["id"] not in run["member_ids"]:
            return err("run not found", 404)
        return jsonify(run_json(run))


@app.post("/api/runs/<rid>/submissions")
def post_submission(rid):
    uid = me()["id"]
    with lock:
        run = runs.get(rid)
        if not run or uid not in run["member_ids"]:
            return err("run not found", 404)
        if run["status"] != "active":
            return err("this quest is no longer active")
    media = request.files.get("media")
    media_url = None
    media_type = None
    if media and media.filename:
        UPLOAD_DIR.mkdir(exist_ok=True)
        ext = os.path.splitext(media.filename)[1].lower()[:8]
        name = f"{new_id()}{ext}"
        media.save(UPLOAD_DIR / name)
        media_url = f"/uploads/{name}"
        media_type = "video" if (media.mimetype or "").startswith("video") else "photo"
    elif run["quest"]["proof"] != "gps":
        return err("media is required")
    taken_raw = request.form.get("taken_at")
    try:
        taken = datetime.fromisoformat(taken_raw.replace("Z", "+00:00")) if taken_raw else now()
    except ValueError:
        taken = now()
    sub = {"id": new_id(), "run_id": rid, "user_id": uid, "media_url": media_url,
           "media_type": media_type or "gps", "lat": num(request.form.get("lat")),
           "lng": num(request.form.get("lng")), "taken_at": iso(taken), "taken_at_dt": taken,
           "verdict": "pending", "reason": ""}
    with lock:
        submissions[sub["id"]] = sub

    def judge():
        status, reason = referee(run, sub)
        with lock:
            sub["verdict"], sub["reason"] = status, reason
            if DEMO_MODE:  # the bot partner approves alongside you
                for m in run["member_ids"]:
                    if m == "bot" and not latest_submission(rid, "bot"):
                        submissions[new_id()] = {**sub, "id": new_id(), "user_id": "bot"}
            refresh_run(run)

    if GEMINI_MODE == "mock":
        judge()
    else:
        threading.Thread(target=judge, daemon=True).start()
    return jsonify({"status": sub["verdict"], "reason": sub["reason"]})


@app.post("/api/runs/<rid>/approve")
def demo_approve(rid):
    """DEMO_MODE only: approve every pending submission by hand when Gemini misbehaves."""
    if not DEMO_MODE:
        return err("demo mode is off", 403)
    with lock:
        run = runs.get(rid)
        if not run:
            return err("run not found", 404)
        for uid in run["member_ids"]:
            s = latest_submission(rid, uid)
            if not s:
                s = {"id": new_id(), "run_id": rid, "user_id": uid, "media_url": None,
                     "media_type": "gps", "lat": None, "lng": None, "taken_at": iso(now()),
                     "taken_at_dt": now()}
                submissions[s["id"]] = s
            s["verdict"], s["reason"] = "approved", "Approved by hand."
        return jsonify(run_json(run))


@app.get("/api/runs/<rid>/recap")
def get_recap(rid):
    with lock:
        run = runs.get(rid)
        if not run or me()["id"] not in run["member_ids"]:
            return err("run not found", 404)
        refresh_run(run)
        if not run["recap"]:
            return err("recap not ready", 404)
        route = [{"lat": p["lat"], "lng": p["lng"], "at": p["time"]}
                 for p in pings if p["run_id"] == rid]
        photos = [s["media_url"] for s in submissions.values()
                  if s["run_id"] == rid and s["verdict"] == "approved" and s["media_url"]]
        return jsonify({"run_id": rid, "summary": run["recap"]["summary"], "route": route,
                        "photos": list(dict.fromkeys(photos)),
                        "narration_url": run["recap"]["narration_url"]})


# ---- location, connections, reports

@app.post("/api/location")
def post_location():
    b = body()
    uid = me()["id"]
    rid = b.get("run_id")
    with lock:
        run = runs.get(rid)
        if not run or uid not in run["member_ids"]:
            return err("run not found", 404)
        for p in b.get("points") or []:
            lat, lng = num(p.get("lat")), num(p.get("lng"))
            if lat is not None and lng is not None:
                pings.append({"time": p.get("at") or iso(now()), "user_id": uid,
                              "run_id": rid, "lat": lat, "lng": lng})
    return "", 204


@app.post("/api/connections")
def post_connection():
    uid = me()["id"]
    rid = body().get("run_id")
    with lock:
        run = runs.get(rid)
        if not run or uid not in run["member_ids"]:
            return err("run not found", 404)
        opted = connections.setdefault(rid, set())
        opted.add(uid)
        if DEMO_MODE and "bot" in run["member_ids"]:
            opted.add("bot")
        others = [m for m in run["member_ids"] if m != uid and m in opted]
        for o in others:
            connected.add(frozenset((uid, o)))
        return jsonify({"connected": bool(others)})


@app.get("/api/connections")
def get_connections():
    uid = me()["id"]
    with lock:
        return jsonify([public_user(next(iter(pair - {uid})))
                        for pair in connected if uid in pair])


@app.post("/api/reports")
def post_report():
    b = body()
    if not b.get("reported_id") or not b.get("reason"):
        return err("reported_id and reason are required")
    with lock:
        reports.append({"id": new_id(), "reporter_id": me()["id"], "reported_id": b["reported_id"],
                        "run_id": b.get("run_id"), "reason": str(b["reason"])[:1000],
                        "created_at": iso(now())})
    return "", 204


# ---- crews

def crew_coins(crew):
    return sum(e["amount"] for e in coin_events if e["crew_id"] == crew["id"])


def crew_json(crew, full=False):
    out = {"id": crew["id"], "name": crew["name"], "invite_code": crew["invite_code"],
           "created_by": crew["created_by"], "created_at": crew["created_at"],
           "coins": crew_coins(crew), "member_count": len(crew["members"])}
    if full:
        out["members"] = [public_user(uid) | {"joined_at": j} for uid, j in crew["members"].items()]
        out["quests"] = [quests[q] for q in crew["quest_ids"] if q in quests]
        out["runs"] = [run_json(r) for r in runs.values() if r["crew_id"] == crew["id"]]
    return out


@app.get("/api/crews")
def list_crews():
    uid = me()["id"]
    with lock:
        return jsonify([crew_json(c) for c in crews.values() if uid in c["members"]])


@app.post("/api/crews")
def create_crew():
    name = str(body().get("name") or "").strip()
    if not name:
        return err("name is required")
    uid = me()["id"]
    with lock:
        c = {"id": new_id(), "name": name[:40], "invite_code": code(), "created_by": uid,
             "created_at": iso(now()), "members": {uid: iso(now())}, "quest_ids": []}
        crews[c["id"]] = c
        return jsonify(crew_json(c, full=True))


@app.get("/api/crews/<cid>")
def get_crew(cid):
    with lock:
        c = crews.get(cid)
        if not c or me()["id"] not in c["members"]:
            return err("crew not found", 404)
        return jsonify(crew_json(c, full=True))


@app.post("/api/crews/join")
def join_crew():
    ic = str(body().get("invite_code") or "").strip().upper()
    with lock:
        c = next((x for x in crews.values() if x["invite_code"] == ic), None)
        if not c:
            return err("no crew with that code", 404)
        c["members"].setdefault(me()["id"], iso(now()))
        return jsonify(crew_json(c, full=True))


@app.post("/api/crews/<cid>/quests")
def share_quest(cid):
    qid = body().get("quest_id")
    with lock:
        c = crews.get(cid)
        if not c or me()["id"] not in c["members"]:
            return err("crew not found", 404)
        if qid not in quests:
            return err("quest not found", 404)
        if qid not in c["quest_ids"]:
            c["quest_ids"].append(qid)
    return "", 204


# ---- leaderboard and dashboard

@app.get("/api/leaderboard")
def leaderboard():
    cid = request.args.get("crew_id")
    with lock:
        if cid:
            c = crews.get(cid)
            if not c:
                return err("crew not found", 404)
            rows = [public_user(uid) | {"coins": sum(e["amount"] for e in coin_events
                                                     if e["user_id"] == uid and e["crew_id"] == cid)}
                    for uid in c["members"]]
        else:
            rows = [{"crew_id": c["id"], "name": c["name"], "coins": crew_coins(c),
                     "member_count": len(c["members"])} for c in crews.values()]
        rows.sort(key=lambda r: r["coins"], reverse=True)
        return jsonify([r | {"rank": i + 1} for i, r in enumerate(rows)])


@app.get("/api/dashboard")
def dashboard():
    uid = me()["id"]
    with lock:
        mine = [r for r in runs.values() if uid in r["member_ids"]]
        for r in mine:
            refresh_run(r)
        done = [r for r in mine if r["status"] == "completed"]
        km = 0.0
        for r in mine:
            pts = [p for p in pings if p["run_id"] == r["id"] and p["user_id"] == uid]
            for a, b in zip(pts, pts[1:]):
                km += distance_m(a["lat"], a["lng"], b["lat"], b["lng"]) / 1000
        met = {m for r in done if r["mode"] == "pair" for m in r["member_ids"] if m != uid}
        history = [{"run_id": r["id"], "title": r["quest"]["title"], "mode": r["mode"],
                    "status": r["status"], "started_at": r["started_at"]}
                   for r in sorted(mine, key=lambda r: r["started_at"], reverse=True)]
        return jsonify({"quests_done": len(done), "km_moved": round(km, 2),
                        "people_met": len(met), "coins": me()["coins"], "history": history})


# ---- claim games

def game_json(gm):
    return {k: gm[k] for k in ("id", "name", "status", "created_by", "created_at")} | {
        "teams": gm["teams"], "zones": list(gm["zones"].values())}


@app.post("/api/games")
def create_game():
    b = body()
    uid = me()["id"]
    with lock:
        gm = {"id": new_id(), "name": str(b.get("name") or "Claim")[:40], "status": "active",
              "created_by": uid, "created_at": iso(now()), "teams": [], "zones": {}}
        for cid in b.get("crew_ids") or [c["id"] for c in crews.values() if uid in c["members"]]:
            if cid in crews:
                gm["teams"].append({"id": new_id(), "game_id": gm["id"], "crew_id": cid,
                                    "name": crews[cid]["name"]})
        for q in [q for q in quests.values() if q["lat"] is not None]:
            z = {"id": new_id(), "game_id": gm["id"], "name": q["place_name"] or q["title"],
                 "lat": q["lat"], "lng": q["lng"], "radius_m": q["radius_m"] or 75,
                 "quest_id": q["id"], "held_by_team_id": None, "best_result": None}
            gm["zones"][z["id"]] = z
        games[gm["id"]] = gm
        return jsonify(game_json(gm))


@app.get("/api/games/<gid>")
def get_game(gid):
    with lock:
        gm = games.get(gid)
        return jsonify(game_json(gm)) if gm else err("game not found", 404)


@app.post("/api/games/<gid>/zones/<zid>/attempts")
def zone_attempt(gid, zid):
    b = body()
    uid = me()["id"]
    with lock:
        gm = games.get(gid)
        if not gm or zid not in gm["zones"]:
            return err("zone not found", 404)
        z = gm["zones"][zid]
        result = num(b.get("result"))
        if result is None:
            return err("result is required")
        team = next((t for t in gm["teams"]
                     if uid in crews.get(t["crew_id"], {}).get("members", {})), None)
        if not team:
            return err("you're not on a team in this game", 403)
        run = runs.get(b.get("run_id"))
        if run:
            refresh_run(run)
            if run["status"] != "completed":
                return err("finish the quest first")
        if z["best_result"] is None or result > z["best_result"]:
            z["held_by_team_id"], z["best_result"] = team["id"], result
        return jsonify(z)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=True)
