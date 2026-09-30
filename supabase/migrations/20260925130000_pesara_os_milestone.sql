-- Staff can mark a venture milestone complete once. The title stays off the activity line.

create or replace function public.complete_venture_milestone(p_milestone uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  venture uuid;
  app uuid;
  done_at timestamptz;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not authorised';
  end if;
  if p_milestone is null then
    raise exception 'milestone not found';
  end if;

  select m.venture_id, m.completed_at, v.application_id
  into venture, done_at, app
  from public.venture_milestones m
  join public.ventures v on v.id = m.venture_id
  where m.id = p_milestone;

  if venture is null then
    raise exception 'milestone not found';
  end if;
  if done_at is not null then
    return;
  end if;

  update public.venture_milestones
  set completed_at = now()
  where id = p_milestone
    and completed_at is null;

  if app is not null then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'MILESTONE_COMPLETED',
      'idea_application',
      app,
      jsonb_build_object('milestone_id', p_milestone)
    );
  end if;
end;
$$;

revoke all on function public.complete_venture_milestone(uuid) from public, anon;
grant execute on function public.complete_venture_milestone(uuid) to authenticated;
