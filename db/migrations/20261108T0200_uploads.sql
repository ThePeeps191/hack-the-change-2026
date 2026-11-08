-- Proof photos and videos live in the database, so every server (and every
-- Vercel function) can serve them. Files on disk don't survive serverless.
create table if not exists uploads (
  name text primary key,
  data bytea not null,
  created_at timestamptz not null default now()
);
