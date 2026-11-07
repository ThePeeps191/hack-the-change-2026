One timestamped SQL file per change, e.g. `20261107T1500_create_users.sql`. Files only add things, and a merged file is never edited.

Embedded Postgres applies new files when the dev server starts, so restart it after adding one. Tiger Data gets them on deploy, or with `bun run db:migrate`.
