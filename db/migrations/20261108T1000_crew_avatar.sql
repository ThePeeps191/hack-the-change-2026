-- The character a crew picked, as "shape:colour", e.g. "cloud:3". Any member can
-- change it. Null means nobody has, so the character comes from the crew's name.
alter table crews add column if not exists avatar text;
