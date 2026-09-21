-- Sprint 1: durable drafts, server-side references, founder-safe application writes.

alter table public.idea_applications
  alter column reference drop not null;

alter table public.idea_applications
  drop constraint if exists idea_applications_stage_check;

alter table public.idea_applications
  add constraint idea_applications_stage_check check (stage in (
    'draft','submitted','screening','interview','validation','committee',
    'structuring','building','live','parked','declined','withdrawn'
  ));

alter table public.idea_applications
  add column if not exists last_activity_at timestamptz not null default now();

create unique index if not exists idea_applications_reference_uidx
  on public.idea_applications (reference)
  where reference is not null;

drop policy if exists applications_owner on public.idea_applications;

create policy applications_owner_select on public.idea_applications
  for select using (user_id = auth.uid());

create policy applications_owner_insert on public.idea_applications
  for insert with check (
    user_id = auth.uid()
    and stage = 'draft'
    and reference is null
  );

create policy applications_owner_update_draft on public.idea_applications
  for update
  using (user_id = auth.uid() and stage = 'draft')
  with check (
    user_id = auth.uid()
    and stage = 'draft'
    and reference is null
  );

create or replace function private.next_application_reference()
returns text
language plpgsql
as $$
declare
  year text := to_char((timezone('utc', now())), 'YYYY');
  token text;
  candidate text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    token := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    candidate := 'PSR-' || year || '-' || token;
    exit when not exists (
      select 1 from public.idea_applications where reference = candidate
    );
    if attempts > 20 then
      raise exception 'could not allocate application reference';
    end if;
  end loop;
  return candidate;
end;
$$;

create or replace function public.submit_application(p_id uuid)
returns public.idea_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.idea_applications;
  ref text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into app
  from public.idea_applications
  where id = p_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  if app.stage is distinct from 'draft' then
    raise exception 'application is not a draft';
  end if;

  if app.reference is not null then
    raise exception 'application already has a reference';
  end if;

  ref := private.next_application_reference();

  update public.idea_applications
    set
      reference = ref,
      stage = 'submitted',
      submitted_at = now(),
      last_activity_at = now(),
      country = coalesce(nullif(payload->>'country', ''), country),
      updated_at = now()
    where id = p_id
    returning * into app;

  insert into public.application_status_history (application_id, from_stage, to_stage, actor)
  values (p_id, 'draft', 'submitted', auth.uid());

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'APPLICATION_SUBMITTED',
    'idea_application',
    p_id,
    jsonb_build_object('reference', ref)
  );

  return app;
end;
$$;

revoke all on function public.submit_application(uuid) from public;
revoke all on function public.submit_application(uuid) from anon;
grant execute on function public.submit_application(uuid) to authenticated;

create or replace function public.withdraw_application(p_id uuid)
returns public.idea_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.idea_applications;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into app
  from public.idea_applications
  where id = p_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  if app.stage not in ('draft', 'submitted', 'screening') then
    raise exception 'this application can no longer be withdrawn';
  end if;

  insert into public.application_status_history (application_id, from_stage, to_stage, actor)
  values (p_id, app.stage, 'withdrawn', auth.uid());

  update public.idea_applications
    set stage = 'withdrawn', last_activity_at = now(), updated_at = now()
    where id = p_id
    returning * into app;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'APPLICATION_WITHDRAWN', 'idea_application', p_id, '{}'::jsonb);

  return app;
end;
$$;

revoke all on function public.withdraw_application(uuid) from public;
revoke all on function public.withdraw_application(uuid) from anon;
grant execute on function public.withdraw_application(uuid) to authenticated;
