update public.app_snapshots as aps
set snapshot = jsonb_set(
      aps.snapshot,
      '{referenceLists}',
      coalesce(
        (
          select jsonb_agg(list_record - 'description' - 'tagline')
          from jsonb_array_elements(aps.snapshot -> 'referenceLists') as lists(list_record)
        ),
        '[]'::jsonb
      ),
      false
    ),
    version = aps.version + 1,
    updated_at = now()
where jsonb_typeof(aps.snapshot -> 'referenceLists') = 'array'
  and exists (
    select 1
    from jsonb_array_elements(aps.snapshot -> 'referenceLists') as lists(list_record)
    where list_record ? 'description' or list_record ? 'tagline'
  );
