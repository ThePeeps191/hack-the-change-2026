-- On Tiger Data, location pings become a hypertable, and a retention policy
-- deletes them after 30 days so we don't keep anyone's route for long. Embedded
-- Postgres has no TimescaleDB, so this does nothing there. A failure here must
-- not stop the app, because pings work fine in a plain table.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'timescaledb') then
    create extension if not exists timescaledb;
    perform create_hypertable('location_pings', 'time', if_not_exists => true, migrate_data => true);
    perform add_retention_policy('location_pings', interval '30 days', if_not_exists => true);
  end if;
exception when others then
  raise notice 'location_pings stays a plain table: %', sqlerrm;
end $$;
