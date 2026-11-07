# siddhant-ui-overhaul

- **Who:** siddhant
- **What:** full UI overhaul ("quiet field, living objects"): new tokens and fonts (Funnel), sound and haptics, magnetic buttons, rolling numbers, segmented control, floating tab bar, page motion blur, a 3D MapLibre globe map that expands full screen, gooey matching, border-beam quest card, thinking-orb proof check, and human-metrics dashboard. Every screen restyled
- **Touches:** src/app/globals.css, src/app/layout.tsx, src/app/template.tsx, src/components/ui/**, src/features/**, src/lib/feedback.ts, src/lib/contracts.ts (optional fields only: Quest.tags, Dashboard human metrics), src/mocks/dashboard.ts
- **Not touching:** API routes, server code, auth, db
- **Heads-up @danny-foundation:** I'm rewriting home, crew, claim and quest screens but keeping their file paths and exported names (HomeScreen, CrewScreen, ClaimScreen, QuestScreen). Your one-line mounts should re-apply cleanly; ping me if not
- **Status:** foundation (tokens, fonts, feedback, primitives)
