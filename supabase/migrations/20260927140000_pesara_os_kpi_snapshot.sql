-- Staff can record a later reading on a KPI. The number stays off the activity line.

create or replace function public.record_venture_snapshot(p_metric uuid, p_value numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app uuid;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not authorised';
  end if;
  if p_metric is null or p_value is null then
    raise exception 'invalid snapshot';
  end if;

  select v.application_id into app
  from public.venture_metrics m
  join public.ventures v on v.id = m.venture_id
  where m.id = p_metric;

  if not found then
    raise exception 'metric not found';
  end if;

  insert into public.venture_metric_snapshots (metric_id, value_numeric)
  values (p_metric, p_value);

  if app is not null then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'KPI_SNAPSHOT',
      'idea_application',
      app,
      jsonb_build_object('metric_id', p_metric)
    );
  end if;
end;
$$;

revoke all on function public.record_venture_snapshot(uuid, numeric) from public, anon;
grant execute on function public.record_venture_snapshot(uuid, numeric) to authenticated;
