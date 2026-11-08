-- "Find someone to do it with" on a quest: the quest you picked rides along
-- with "I'm free", so the match gets that quest instead of a random one.
alter table availability add column if not exists quest_id text references quests (id);
