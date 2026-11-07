# Work in progress

Every branch adds one file here, `docs/wip/<branch>.md`, in its first commit, and deletes it in the commit that finishes the work. Run `scripts/wip.sh` to see every branch's note at once. It reads them from all pushed branches, so a note is visible as soon as you push, before anything merges.

One file per branch means notes never conflict. Don't add a shared status list.

Use this shape and keep it short:

```md
# siddhant-mvp-frontend

- **Who:** siddhant
- **What:** clickable System 1 screens: home, match, quest, proof, recap
- **Touches:** src/app/(screens), src/components/ui/, src/features/matching/
- **Not touching:** API routes, src/lib/contracts.ts
- **Status:** building the proof screen
```

Update **Status** when it changes meaningfully, and push. If your plans overlap with someone else's **Touches**, talk to them (or their human) before you start.
