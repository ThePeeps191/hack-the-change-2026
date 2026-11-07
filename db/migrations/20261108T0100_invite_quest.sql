-- Invites can carry a specific quest, so the pair skips random quest selection.
alter table matches add column quest_id text references quests (id);
