# jonas-invite-host-advance

- **Who:** jonas
- **What:** fix the host getting stuck on the share/invite screen after someone scans the QR / accepts the AirDrop link — poll for the accept and send the host to the quest too
- **Touches:** src/features/quests/quest-sheet.tsx, src/features/invites/invite-screen.tsx
- **Not touching:** API routes, src/server/, src/lib/contracts.ts
- **Status:** implemented, verifying
