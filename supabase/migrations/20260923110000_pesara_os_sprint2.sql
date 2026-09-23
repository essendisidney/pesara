-- Sprint 2: staff assignment and stage changes write history in the same transaction.

create or replace function public.assign_application_analyst(p_id uuid, p_analyst uuid)
returns public.idea_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.idea_applications;
  previous uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not private.is_staff() then
    raise exception 'not staff';
  end if;

  if p_analyst is not null and not exists (
    select 1 from public.user_roles
    where user_id = p_analyst
      and role in ('ANALYST','PRODUCT','ENGINEER','INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN')
  ) then
    raise exception 'analyst is not staff';
  end if;

  select * into app
  from public.idea_applications
  where id = p_id
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  if app.assigned_analyst is not distinct from p_analyst then
    return app;
  end if;

  previous := app.assigned_analyst;

  update public.idea_applications
    set
      assigned_analyst = p_analyst,
      last_activity_at = now(),
      updated_at = now()
    where id = p_id
    returning * into app;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ANALYST_ASSIGNED',
    'idea_application',
    p_id,
    jsonb_build_object('from_analyst', previous, 'to_analyst', p_analyst)
  );

  return app;
end;
$$;

revoke all on function public.assign_application_analyst(uuid, uuid) from public;
revoke all on function public.assign_application_analyst(uuid, uuid) from anon;
grant execute on function public.assign_application_analyst(uuid, uuid) to authenticated;

create or replace function public.set_application_stage(p_id uuid, p_stage text)
returns public.idea_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.idea_applications;
  previous text;
  ref text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not private.is_staff() then
    raise exception 'not staff';
  end if;

  if p_stage not in (
    'submitted','screening','interview','validation','committee',
    'structuring','building','live','parked','declined','withdrawn'
  ) then
    raise exception 'invalid stage';
  end if;

  select * into app
  from public.idea_applications
  where id = p_id
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  if app.stage = p_stage then
    return app;
  end if;

  previous := app.stage;

  if app.reference is null and p_stage <> 'withdrawn' then
    ref := private.next_application_reference();
  end if;

  insert into public.application_status_history (application_id, from_stage, to_stage, actor)
  values (p_id, previous, p_stage, auth.uid());

  update public.idea_applications
    set
      reference = coalesce(idea_applications.reference, ref),
      submitted_at = case
        when idea_applications.submitted_at is null and p_stage <> 'withdrawn' then now()
        else idea_applications.submitted_at
      end,
      country = coalesce(nullif(idea_applications.payload->>'country', ''), idea_applications.country),
      stage = p_stage,
      last_activity_at = now(),
      updated_at = now()
    where id = p_id
    returning * into app;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'STAGE_CHANGED',
    'idea_application',
    p_id,
    jsonb_build_object('from_stage', previous, 'to_stage', p_stage)
  );

  return app;
end;
$$;

revoke all on function public.set_application_stage(uuid, text) from public;
revoke all on function public.set_application_stage(uuid, text) from anon;
grant execute on function public.set_application_stage(uuid, text) to authenticated;

create or replace function public.add_application_note(p_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  note_body text := btrim(coalesce(p_body, ''));
  note_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not private.is_staff() then
    raise exception 'not staff';
  end if;

  if note_body = '' or char_length(note_body) > 4000 then
    raise exception 'invalid note';
  end if;

  if not exists (select 1 from public.idea_applications where id = p_id) then
    raise exception 'application not found';
  end if;

  insert into public.admin_notes (entity, entity_id, body, created_by)
  values ('idea_application', p_id, note_body, auth.uid())
  returning id into note_id;

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = p_id;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'NOTE_ADDED',
    'idea_application',
    p_id,
    jsonb_build_object('note_id', note_id)
  );

  return note_id;
end;
$$;

revoke all on function public.add_application_note(uuid, text) from public;
revoke all on function public.add_application_note(uuid, text) from anon;
grant execute on function public.add_application_note(uuid, text) to authenticated;

create index if not exists admin_notes_entity_idx
  on public.admin_notes (entity, entity_id, created_at desc);
