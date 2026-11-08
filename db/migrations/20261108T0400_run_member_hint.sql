-- "How to spot me": one short line each person can add during a quest with
-- someone new, like "red jacket, by the main doors", shown to their partner.
alter table run_members add column if not exists hint text;
