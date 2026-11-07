# Amble Flask backend

Every endpoint in `docs/CONTRACTS.md` lives in one file: `app.py`. State is kept in memory for now (a restart clears it), so it runs with no database or keys.

```sh
cd backend
pip install -r requirements.txt
PORT=5001 python app.py
```

- `AUTH_MODE=mock` (default): you are whoever the `X-User` header, `?as=` query or `amble_user` cookie names, `demo` by default. Two tabs with different names can match each other.
- `GEMINI_MODE=mock` (default): quests come from `data/quests/*.json` (the built-in fallback if that's missing) and proof is approved if the location and time check out. The Gemini calls go in `generate_quests()` and `referee()`.
- `DEMO_MODE=1`: when you say you're free, a bot partner matches you and accepts. Location and time checks are skipped, and `POST /api/runs/:id/approve` approves proof by hand.
- `GET /api/health` shows which modes are on.

Still to do: Postgres on Tiger Data, a live Auth0 login, and live Gemini.
