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
  v_next_snapshot jsonb := next_snapshot;
  v_expected_revision bigint := expected_revision;
  v_operation_id text := operation_id;
  v_expected_versions jsonb := expected_versions;
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

  if v_expected_revision is null then
    raise exception 'conflict: expected canonical revision is required';
  end if;

  if v_operation_id is null or length(trim(v_operation_id)) = 0 then
    raise exception 'operation id is required';
  end if;

  if v_expected_versions is null or jsonb_typeof(v_expected_versions) <> 'object' then
    raise exception 'expected versions must be a JSON object';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_operation_id, 0));

  select aso.*
  into prior_operation
  from public.app_snapshot_operations as aso
  where aso.operation_id = v_operation_id;

  if found then
    if prior_operation.expected_revision <> v_expected_revision
      or prior_operation.expected_versions <> v_expected_versions
      or prior_operation.next_snapshot <> v_next_snapshot then
      raise exception 'operation id was reused with a different snapshot request';
    end if;
    return prior_operation.result;
  end if;

  select aps.snapshot, aps.version
  into current_snapshot, current_revision
  from public.app_snapshots as aps
  where aps.id = 'owner'
  for update;

  if current_snapshot is null then
    if v_expected_revision <> 0 then
      raise exception 'conflict: stale canonical revision';
    end if;

    if v_expected_versions <> '{}'::jsonb then
      raise exception 'conflict: expected entity versions do not exist';
    end if;

    insert into public.app_snapshots as aps (id, snapshot, schema_version, version)
    values ('owner', v_next_snapshot, coalesce((v_next_snapshot ->> 'schemaVersion')::integer, 2), 1)
    returning aps.version into next_revision;
  else
    if current_revision <> v_expected_revision then
      raise exception 'conflict: stale canonical revision';
    end if;

    for expected in select ev.key, ev.value from jsonb_each_text(v_expected_versions) as ev
    loop
      actual_version := null;
      version_found := false;

      select (records.record ->> 'version')::bigint, true
      into actual_version, version_found
      from (
        select jsonb_array_elements(entries.value) as record
        from jsonb_each(current_snapshot) as entries
        where jsonb_typeof(entries.value) = 'array'
      ) as records
      where records.record ->> 'id' = expected.key
      limit 1;

      if not coalesce(version_found, false) or actual_version <> expected.value::bigint then
        raise exception 'conflict: stale version for %', expected.key;
      end if;
    end loop;

    update public.app_snapshots as aps
    set snapshot = v_next_snapshot,
        schema_version = coalesce((v_next_snapshot ->> 'schemaVersion')::integer, aps.schema_version),
        version = aps.version + 1,
        updated_at = now()
    where aps.id = 'owner'
    returning aps.version into next_revision;
  end if;

  operation_result := jsonb_build_object(
    'snapshot', v_next_snapshot,
    'canonicalRevision', next_revision
  );

  delete from public.app_snapshot_operations as aso;

  insert into public.app_snapshot_operations as aso (
    operation_id,
    expected_revision,
    expected_versions,
    next_snapshot,
    result
  ) values (
    v_operation_id,
    v_expected_revision,
    v_expected_versions,
    v_next_snapshot,
    operation_result
  );

  return operation_result;
end;
$$;

comment on function public.todonut_replace_snapshot(jsonb, bigint, text, jsonb) is
  'Atomically replaces the canonical ToDonut snapshot after canonical revision and entity version checks; operation IDs are idempotent.';
