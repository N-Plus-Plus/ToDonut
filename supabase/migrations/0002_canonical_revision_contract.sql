alter table public.app_snapshots
  alter column version set default 1,
  alter column version set not null;

update public.app_snapshots
set version = 1
where version is null or version < 1;

create or replace function public.todonut_get_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
  current_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select snapshot, version
  into current_snapshot, current_revision
  from public.app_snapshots
  where id = 'owner';

  if current_snapshot is null then
    return null;
  end if;

  return jsonb_build_object(
    'snapshot', current_snapshot,
    'canonicalRevision', current_revision
  );
end;
$$;

create or replace function public.todonut_replace_snapshot(
  next_snapshot jsonb,
  expected_revision bigint,
  operation_id text,
  expected_versions jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
  current_revision bigint;
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if expected_revision is null then
    raise exception 'conflict: expected canonical revision is required';
  end if;

  if operation_id is null or length(trim(operation_id)) = 0 then
    raise exception 'operation id is required';
  end if;

  select snapshot, version
  into current_snapshot, current_revision
  from public.app_snapshots
  where id = 'owner'
  for update;

  if current_snapshot is null then
    if expected_revision <> 0 then
      raise exception 'conflict: stale canonical revision';
    end if;

    insert into public.app_snapshots (id, snapshot, schema_version, version)
    values ('owner', next_snapshot, coalesce((next_snapshot ->> 'schemaVersion')::integer, 2), 1)
    returning version into next_revision;

    return jsonb_build_object('snapshot', next_snapshot, 'canonicalRevision', next_revision);
  end if;

  if current_revision <> expected_revision then
    raise exception 'conflict: stale canonical revision';
  end if;

  update public.app_snapshots
  set snapshot = next_snapshot,
      schema_version = 2,
      version = version + 1,
      updated_at = now()
  where id = 'owner'
  returning version into next_revision;

  return jsonb_build_object(
    'snapshot', next_snapshot,
    'canonicalRevision', next_revision
  );
end;
$$;

comment on column public.app_snapshots.version is
  'Monotonically increasing canonical ToDonut snapshot revision. Every replacement must submit the revision originally read.';
