-- The character you picked on the You page, as "shape:colour", e.g. "cloud:3".
-- Null means you haven't picked one, so your character comes from your name.
alter table users add column if not exists avatar text;
