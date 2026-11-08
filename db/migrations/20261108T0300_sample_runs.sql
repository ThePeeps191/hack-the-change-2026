-- "Try the demo" guests get a few sample quests so their You page isn't empty
-- (seedSampleHistory in src/server/db/setup.ts). They're marked, so the weekly
-- crew board never counts them and the You page can say they're samples.
alter table quest_runs add column if not exists sample boolean not null default false;
