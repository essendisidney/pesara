-- Activity records are append-only. Founders cannot read another founder's
-- application, documents, messages, assessment, venture workspace, or profile.
-- Staff writes go through security-definer functions, which check user_roles.

create or replace function private.reject_activity_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'activity records are immutable';
end;
$$;

drop trigger if exists activity_logs_immutable on public.activity_logs;
create trigger activity_logs_immutable
  before update or delete on public.activity_logs
  for each row execute function private.reject_activity_mutation();

drop policy if exists logs_insert_staff on public.activity_logs;
revoke insert, update, delete on public.activity_logs from anon, authenticated;

create or replace function private.log_validation_started()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage = 'validation' and old.stage is distinct from 'validation' then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'VALIDATION_STARTED',
      'idea_application',
      new.id,
      jsonb_build_object('from_stage', old.stage, 'to_stage', new.stage)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists idea_applications_validation_started on public.idea_applications;
create trigger idea_applications_validation_started
  after update of stage on public.idea_applications
  for each row execute function private.log_validation_started();

create or replace function private.log_experiment_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.outcome is not null then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'EXPERIMENT_COMPLETED',
      'idea_application',
      new.application_id,
      jsonb_build_object('experiment_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists validation_experiments_completed on public.validation_experiments;
create trigger validation_experiments_completed
  after insert on public.validation_experiments
  for each row execute function private.log_experiment_completed();

create or replace function public.save_viability_assessment(p_id uuid, p_notes text, p_scores jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  assessment uuid;
  version int;
  assessment_note text := btrim(coalesce(p_notes, ''));
  assessment_action text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if not exists (select 1 from public.idea_applications where id = p_id) then
    raise exception 'application not found';
  end if;
  if jsonb_typeof(p_scores) is distinct from 'array' or jsonb_array_length(p_scores) = 0 then
    raise exception 'invalid scores';
  end if;
  if char_length(assessment_note) > 4000 then
    raise exception 'invalid note';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_scores) as s(dimension text, score int, note text)
    group by s.dimension
    having count(*) > 1
  ) then
    raise exception 'invalid dimension';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_scores) as s(dimension text, score int, note text)
    where s.score is null
      or s.score < 1
      or s.score > 5
      or btrim(coalesce(s.note, '')) = ''
      or char_length(btrim(s.note)) > 2000
      or not exists (select 1 from public.viability_dimensions d where d.key = s.dimension)
  ) then
    raise exception 'invalid score';
  end if;

  select coalesce(max(viability_assessments.version), 0) + 1
    into version
  from public.viability_assessments
  where application_id = p_id;

  insert into public.viability_assessments (application_id, version, notes, created_by)
  values (p_id, version, nullif(assessment_note, ''), auth.uid())
  returning id into assessment;

  insert into public.assessment_scores (assessment_id, dimension, score, analyst_note)
  select assessment, btrim(s.dimension), s.score, btrim(s.note)
  from jsonb_to_recordset(p_scores) as s(dimension text, score int, note text);

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = p_id;

  assessment_action := case when version = 1 then 'ASSESSMENT_CREATED' else 'ASSESSMENT_UPDATED' end;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    assessment_action,
    'idea_application',
    p_id,
    jsonb_build_object('assessment_id', assessment, 'version', version)
  );

  return assessment;
end;
$$;

-- Staff may read operating tables. Writes stay in the definer functions above and in earlier migrations.
drop policy if exists applications_staff on public.idea_applications;
create policy applications_staff on public.idea_applications
  for select using (private.is_staff());

drop policy if exists ideas_staff on public.ideas;
create policy ideas_staff on public.ideas
  for select using (private.is_staff());

drop policy if exists history_staff on public.application_status_history;
create policy history_staff on public.application_status_history
  for select using (private.is_staff());

drop policy if exists documents_staff on public.application_documents;
create policy documents_staff on public.application_documents
  for select using (private.is_staff());

drop policy if exists documents_insert_owner on public.application_documents;

drop policy if exists dimensions_staff on public.viability_dimensions;

drop policy if exists assessments_staff on public.viability_assessments;
create policy assessments_staff on public.viability_assessments
  for select using (private.is_staff());

drop policy if exists scores_staff on public.assessment_scores;
create policy scores_staff on public.assessment_scores
  for select using (private.is_staff());

drop policy if exists decisions_staff on public.committee_decisions;
create policy decisions_staff on public.committee_decisions
  for select using (private.is_staff());

drop policy if exists decision_members_staff on public.committee_decision_members;
create policy decision_members_staff on public.committee_decision_members
  for select using (private.is_staff());

drop policy if exists experiments_staff on public.validation_experiments;
create policy experiments_staff on public.validation_experiments
  for select using (private.is_staff());

drop policy if exists results_staff on public.validation_results;
create policy results_staff on public.validation_results
  for select using (private.is_staff());

drop policy if exists ventures_staff on public.ventures;
create policy ventures_staff on public.ventures
  for select using (private.is_staff());

drop policy if exists ventures_public on public.ventures;

drop policy if exists venture_founders_staff on public.venture_founders;
create policy venture_founders_staff on public.venture_founders
  for select using (private.is_staff());

drop policy if exists venture_metrics_staff on public.venture_metrics;
create policy venture_metrics_staff on public.venture_metrics
  for select using (private.is_staff());

drop policy if exists venture_snapshots_staff on public.venture_metric_snapshots;
create policy venture_snapshots_staff on public.venture_metric_snapshots
  for select using (private.is_staff());

drop policy if exists venture_docs_staff on public.venture_documents;
create policy venture_docs_staff on public.venture_documents
  for select using (private.is_staff());

drop policy if exists venture_milestones_staff on public.venture_milestones;
create policy venture_milestones_staff on public.venture_milestones
  for select using (private.is_staff());

drop policy if exists notes_staff on public.admin_notes;
create policy notes_staff on public.admin_notes
  for select using (private.is_staff());

drop policy if exists referral_events_owner on public.referral_events;
drop policy if exists messages_insert on public.messages;

create or replace view public.portfolio_ventures
with (security_barrier = true, security_invoker = false) as
select
  id,
  name,
  slug,
  description,
  industry,
  country,
  stage,
  website,
  status,
  pesara_relationship
from public.ventures
where public_visible = true
  and is_demo = false;

grant select on public.portfolio_ventures to anon, authenticated;
