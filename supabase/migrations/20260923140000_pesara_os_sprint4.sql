-- Sprint 4: founder-facing outcomes stay on founder_decision_view.
-- A Build decision becomes a venture only when an admin converts it.
-- Commercial terms stay on the venture row and are not public.

alter table public.ventures
  add column if not exists application_id uuid unique references public.idea_applications (id),
  add column if not exists commercial_kind text,
  add column if not exists pesara_contribution text,
  add column if not exists founder_contribution text,
  add column if not exists commercial_terms text,
  add column if not exists revenue_share text,
  add column if not exists equity_interest text,
  add column if not exists agreement_date date,
  add column if not exists agreement_document text,
  add column if not exists technology_notes text;

alter table public.ventures
  drop constraint if exists ventures_commercial_kind_check;

alter table public.ventures
  add constraint ventures_commercial_kind_check
  check (
    commercial_kind is null
    or commercial_kind in ('CLIENT_BUILD','BUILD_GROW','VENTURE_BUILD','JOINT_VENTURE','PESARA_LABS')
  );

create or replace function public.create_venture_from_application(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.idea_applications;
  new_venture uuid;
  existing uuid;
  latest text;
  venture_name text;
  venture_slug text;
  founder_name text;
  previous text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'not staff';
  end if;

  select * into app
  from public.idea_applications
  where id = p_id
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  select id into existing
  from public.ventures
  where application_id = p_id;

  if existing is not null then
    return existing;
  end if;

  select decision into latest
  from public.committee_decisions
  where application_id = p_id
  order by created_at desc, id desc
  limit 1;

  if latest is distinct from 'BUILD' then
    raise exception 'invalid decision';
  end if;

  venture_name := coalesce(nullif(btrim(app.payload->>'ideaName'), ''), 'Untitled idea');
  venture_slug := trim(both '-' from lower(regexp_replace(venture_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if venture_slug = '' then
    venture_slug := 'venture';
  end if;
  venture_slug := left(venture_slug, 48);
  if exists (select 1 from public.ventures where slug = venture_slug) then
    venture_slug := venture_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  select coalesce(nullif(btrim(full_name), ''), nullif(btrim(app.payload->>'fullName'), ''), 'Founder')
    into founder_name
  from public.profiles
  where id = app.user_id;

  if founder_name is null then
    founder_name := coalesce(nullif(btrim(app.payload->>'fullName'), ''), 'Founder');
  end if;

  insert into public.ventures (
    application_id, name, slug, description, industry, country, stage, status,
    pesara_relationship, public_visible, is_demo
  ) values (
    p_id,
    venture_name,
    venture_slug,
    coalesce(nullif(btrim(app.payload->>'oneLiner'), ''), nullif(btrim(app.payload->>'proposedSolution'), '')),
    nullif(btrim(coalesce(app.industry, '')), ''),
    nullif(btrim(coalesce(app.country, '')), ''),
    'Structuring',
    'BUILDING',
    'none',
    false,
    false
  )
  returning id into new_venture;

  insert into public.venture_founders (venture_id, user_id, full_name)
  values (new_venture, app.user_id, founder_name);

  if app.stage not in ('structuring', 'building', 'live') then
    previous := app.stage;
    insert into public.application_status_history (application_id, from_stage, to_stage, actor)
    values (p_id, previous, 'structuring', auth.uid());
    update public.idea_applications
      set stage = 'structuring', last_activity_at = now(), updated_at = now()
      where id = p_id;
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'STAGE_CHANGED',
      'idea_application',
      p_id,
      jsonb_build_object('from_stage', previous, 'to_stage', 'structuring')
    );
  else
    update public.idea_applications
      set last_activity_at = now(), updated_at = now()
      where id = p_id;
  end if;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'VENTURE_CREATED',
    'idea_application',
    p_id,
    jsonb_build_object('venture_id', new_venture)
  );

  return new_venture;
end;
$$;

revoke all on function public.create_venture_from_application(uuid) from public;
revoke all on function public.create_venture_from_application(uuid) from anon;
grant execute on function public.create_venture_from_application(uuid) to authenticated;

create or replace function public.update_venture_workspace(
  p_id uuid,
  p_name text,
  p_description text,
  p_industry text,
  p_country text,
  p_stage text,
  p_status text,
  p_relationship text,
  p_website text,
  p_technology text,
  p_commercial_kind text,
  p_pesara_contribution text,
  p_founder_contribution text,
  p_commercial_terms text,
  p_revenue_share text,
  p_equity_interest text,
  p_agreement_date date,
  p_agreement_document text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  venture_name text := btrim(coalesce(p_name, ''));
  website text := nullif(btrim(coalesce(p_website, '')), '');
  kind text := nullif(btrim(coalesce(p_commercial_kind, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'not staff';
  end if;
  if venture_name = '' or char_length(venture_name) > 200 then
    raise exception 'invalid venture';
  end if;
  if p_status not in ('VALIDATING','BUILDING','LIVE','SCALING','EXITED','PAUSED') then
    raise exception 'invalid venture';
  end if;
  if p_relationship not in ('none','built_by_pesara','pesara_company','technology_by_pesara') then
    raise exception 'invalid venture';
  end if;
  if kind is not null and kind not in ('CLIENT_BUILD','BUILD_GROW','VENTURE_BUILD','JOINT_VENTURE','PESARA_LABS') then
    raise exception 'invalid venture';
  end if;
  if website is not null and website !~ '^https?://' then
    raise exception 'invalid venture';
  end if;
  if not exists (select 1 from public.ventures where id = p_id) then
    raise exception 'application not found';
  end if;

  update public.ventures
    set
      name = venture_name,
      description = nullif(btrim(coalesce(p_description, '')), ''),
      industry = nullif(btrim(coalesce(p_industry, '')), ''),
      country = nullif(btrim(coalesce(p_country, '')), ''),
      stage = nullif(btrim(coalesce(p_stage, '')), ''),
      status = p_status,
      pesara_relationship = p_relationship,
      website = website,
      technology_notes = nullif(btrim(coalesce(p_technology, '')), ''),
      commercial_kind = kind,
      pesara_contribution = nullif(btrim(coalesce(p_pesara_contribution, '')), ''),
      founder_contribution = nullif(btrim(coalesce(p_founder_contribution, '')), ''),
      commercial_terms = nullif(btrim(coalesce(p_commercial_terms, '')), ''),
      revenue_share = nullif(btrim(coalesce(p_revenue_share, '')), ''),
      equity_interest = nullif(btrim(coalesce(p_equity_interest, '')), ''),
      agreement_date = p_agreement_date,
      agreement_document = nullif(btrim(coalesce(p_agreement_document, '')), ''),
      updated_at = now()
    where id = p_id;
end;
$$;

revoke all on function public.update_venture_workspace(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text) from public;
revoke all on function public.update_venture_workspace(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text) from anon;
grant execute on function public.update_venture_workspace(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text) to authenticated;

create or replace function public.add_venture_milestone(p_id uuid, p_title text, p_due date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  milestone uuid;
  milestone_title text := btrim(coalesce(p_title, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if milestone_title = '' or char_length(milestone_title) > 200 then
    raise exception 'invalid venture';
  end if;
  if not exists (select 1 from public.ventures where id = p_id) then
    raise exception 'application not found';
  end if;
  insert into public.venture_milestones (venture_id, title, due_on)
  values (p_id, milestone_title, p_due)
  returning id into milestone;
  return milestone;
end;
$$;

revoke all on function public.add_venture_milestone(uuid, text, date) from public;
revoke all on function public.add_venture_milestone(uuid, text, date) from anon;
grant execute on function public.add_venture_milestone(uuid, text, date) to authenticated;

create or replace function public.add_venture_kpi(p_id uuid, p_label text, p_value numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  metric uuid;
  kpi_label text := btrim(coalesce(p_label, ''));
  kpi_key text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if kpi_label = '' or char_length(kpi_label) > 80 or p_value is null then
    raise exception 'invalid venture';
  end if;
  if not exists (select 1 from public.ventures where id = p_id) then
    raise exception 'application not found';
  end if;
  kpi_key := left(lower(regexp_replace(kpi_label, '[^a-zA-Z0-9]+', '-', 'g')), 40);
  if kpi_key = '' then
    kpi_key := 'kpi';
  end if;
  if exists (select 1 from public.venture_metrics where venture_id = p_id and key = kpi_key) then
    kpi_key := kpi_key || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;
  insert into public.venture_metrics (venture_id, key, label)
  values (p_id, kpi_key, kpi_label)
  returning id into metric;
  insert into public.venture_metric_snapshots (metric_id, value_numeric)
  values (metric, p_value);
  return metric;
end;
$$;

revoke all on function public.add_venture_kpi(uuid, text, numeric) from public;
revoke all on function public.add_venture_kpi(uuid, text, numeric) from anon;
grant execute on function public.add_venture_kpi(uuid, text, numeric) to authenticated;

create or replace function public.add_venture_note(p_id uuid, p_body text)
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
  if not exists (select 1 from public.ventures where id = p_id) then
    raise exception 'application not found';
  end if;
  insert into public.admin_notes (entity, entity_id, body, created_by)
  values ('venture', p_id, note_body, auth.uid())
  returning id into note_id;
  return note_id;
end;
$$;

revoke all on function public.add_venture_note(uuid, text) from public;
revoke all on function public.add_venture_note(uuid, text) from anon;
grant execute on function public.add_venture_note(uuid, text) to authenticated;
