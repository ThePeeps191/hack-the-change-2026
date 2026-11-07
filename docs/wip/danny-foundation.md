# danny-foundation

- **Who:** danny
- **What:** the real multi-user backend behind the existing screens: database, identity, System 1, crews, coins, dashboard, Claim, Auth0, deploy kit, plus the few screens that are missing
- **Touches:** src/server/, src/app/api/, src/lib/ (db, auth, http, api, contracts, gemini mock branches only), src/proxy.ts, db/, deploy/, scripts/, next.config.ts, package.json, docs. New screens in new files: src/app/login, welcome, invite, join. One-line mounts in home, crew, claim and quest screens
- **Not touching:** design tokens, src/components/ui/, restyling any screen, data/quests/, live Gemini calls
- **Status:** starting. Draft PR stays unmerged until Danny says so
