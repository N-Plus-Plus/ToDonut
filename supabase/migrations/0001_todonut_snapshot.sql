create table if not exists public.app_snapshots (
  id text primary key default 'owner',
  snapshot jsonb not null,
  schema_version integer not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

create policy "owner can read snapshot"
  on public.app_snapshots for select
  to authenticated
  using (id = 'owner');

create policy "owner can insert snapshot"
  on public.app_snapshots for insert
  to authenticated
  with check (id = 'owner');

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.security_events enable row level security;

create policy "owner can read security events"
  on public.security_events for select
  to authenticated
  using (true);

create or replace function public.todonut_get_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select snapshot into current_snapshot
  from public.app_snapshots
  where id = 'owner';

  return current_snapshot;
end;
$$;

create or replace function public.todonut_replace_snapshot(next_snapshot jsonb, expected_versions jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
  expected record;
  actual_version integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select snapshot into current_snapshot
  from public.app_snapshots
  where id = 'owner'
  for update;

  if current_snapshot is null then
    insert into public.app_snapshots (id, snapshot, schema_version, version)
    values ('owner', next_snapshot, coalesce((next_snapshot ->> 'schemaVersion')::integer, 2), 1);
    return next_snapshot;
  end if;

  for expected in select * from jsonb_each_text(expected_versions)
  loop
    select (record ->> 'version')::integer into actual_version
    from (
      select jsonb_array_elements(value) as record
      from jsonb_each(current_snapshot)
      where jsonb_typeof(value) = 'array'
    ) records
    where record ->> 'id' = expected.key
    limit 1;

    if actual_version is not null and actual_version <> expected.value::integer then
      raise exception 'conflict: stale version for %', expected.key;
    end if;
  end loop;

  update public.app_snapshots
  set snapshot = next_snapshot,
      schema_version = 2,
      version = version + 1,
      updated_at = now()
  where id = 'owner';

  return next_snapshot;
end;
$$;

create or replace function public.todonut_process_due_recurrences(today_date text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select snapshot into current_snapshot
  from public.app_snapshots
  where id = 'owner'
  for update;

  -- The browser runs the same deterministic generator after this locked read.
  -- This RPC exists as the server-authoritative serialization point for a future
  -- generated-task SQL implementation and prevents concurrent snapshot writes
  -- during launch catch-up.
  return current_snapshot;
end;
$$;

create index if not exists app_snapshots_schema_version_idx on public.app_snapshots (schema_version);
create index if not exists security_events_occurred_at_idx on public.security_events (occurred_at desc);
