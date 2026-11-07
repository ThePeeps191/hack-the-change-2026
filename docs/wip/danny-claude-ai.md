# danny-claude-ai

- **Who:** danny
- **What:** run the AI on Claude Haiku 5.5 with ANTHROPIC_API_KEY (shell or .env), keeping Gemini as a switch. Real nearby places from OpenStreetMap so Claude's quests are at real spots
- **Touches:** src/lib/ai*.ts (new seam, replaces gemini.ts), src/lib/gemini-live.ts, src/lib/places.ts, src/server/{quests,proof,recaps}.ts, src/lib/env.ts, src/app/api/health, package.json, .env.example, deploy/setup.sh, docs
- **Not touching:** screens, components, data/quests/
- **Status:** starting
