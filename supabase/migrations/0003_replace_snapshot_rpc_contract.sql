create table if not exists public.app_snapshot_operations (
  operation_id text primary key,
  expected_revision bigint not null,
  expected_versions jsonb not null,
  next_snapshot jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.app_snapshot_operations enable row level security;

drop function if exists public.todonut_replace_snapshot(jsonb, jsonb);
drop function if exists public.todonut_replace_snapshot(jsonb, bigint, text, jsonb);

create function public.todonut_replace_snapshot(
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
<<replace_snapshot>>
declare
  current_snapshot jsonb;
  current_revision bigint;
  next_revision bigint;
  expected record;
  actual_version bigint;
  version_found boolean;
  prior_operation public.app_snapshot_operations%rowtype;
  operation_result jsonb;
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

  if expected_versions is null or jsonb_typeof(expected_versions) <> 'object' then
    raise exception 'expected versions must be a JSON object';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(operation_id, 0));

  select *
  into prior_operation
  from public.app_snapshot_operations
  where app_snapshot_operations.operation_id = replace_snapshot.operation_id;

  if found then
    if prior_operation.expected_revision <> expected_revision
      or prior_operation.expected_versions <> expected_versions
      or prior_operation.next_snapshot <> next_snapshot then
      raise exception 'operation id was reused with a different snapshot request';
    end if;
    return prior_operation.result;
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

    if expected_versions <> '{}'::jsonb then
      raise exception 'conflict: expected entity versions do not exist';
    end if;

    insert into public.app_snapshots (id, snapshot, schema_version, version)
    values ('owner', next_snapshot, coalesce((next_snapshot ->> 'schemaVersion')::integer, 2), 1)
    returning version into next_revision;
  else
    if current_revision <> expected_revision then
      raise exception 'conflict: stale canonical revision';
    end if;

    for expected in select * from jsonb_each_text(expected_versions)
    loop
      actual_version := null;
      version_found := false;

      select (record ->> 'version')::bigint, true
      into actual_version, version_found
      from (
        select jsonb_array_elements(value) as record
        from jsonb_each(current_snapshot)
        where jsonb_typeof(value) = 'array'
      ) records
      where record ->> 'id' = expected.key
      limit 1;

      if not coalesce(version_found, false) or actual_version <> expected.value::bigint then
        raise exception 'conflict: stale version for %', expected.key;
      end if;
    end loop;

    update public.app_snapshots
    set snapshot = next_snapshot,
        schema_version = coalesce((next_snapshot ->> 'schemaVersion')::integer, schema_version),
        version = version + 1,
        updated_at = now()
    where id = 'owner'
    returning version into next_revision;
  end if;

  operation_result := jsonb_build_object(
    'snapshot', next_snapshot,
    'canonicalRevision', next_revision
  );

  delete from public.app_snapshot_operations;

  insert into public.app_snapshot_operations (
    operation_id,
    expected_revision,
    expected_versions,
    next_snapshot,
    result
  ) values (
    operation_id,
    expected_revision,
    expected_versions,
    next_snapshot,
    operation_result
  );

  return operation_result;
end;
$$;

comment on function public.todonut_replace_snapshot(jsonb, bigint, text, jsonb) is
  'Atomically replaces the canonical ToDonut snapshot after canonical revision and entity version checks; operation IDs are idempotent.';
