-- Recovered from production (applied as 20260927162537_pesara_os_sprint3_functions).
-- Staff RPCs for viability assessments, dimension weights, validation experiments and committee decisions.

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

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ASSESSMENT_RECORDED',
    'idea_application',
    p_id,
    jsonb_build_object('assessment_id', assessment, 'version', version)
  );

  return assessment;
end;
$$;

revoke all on function public.save_viability_assessment(uuid, text, jsonb) from public;
revoke all on function public.save_viability_assessment(uuid, text, jsonb) from anon;
grant execute on function public.save_viability_assessment(uuid, text, jsonb) to authenticated;

create or replace function public.set_dimension_weights(p_weights jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'not staff';
  end if;
  if jsonb_typeof(p_weights) is distinct from 'array' or jsonb_array_length(p_weights) = 0 then
    raise exception 'invalid weights';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_weights) as w(dimension text, weight numeric)
    where w.weight is null
      or w.weight < 0.1
      or w.weight > 10
      or not exists (select 1 from public.viability_dimensions d where d.key = w.dimension)
  ) then
    raise exception 'invalid weights';
  end if;

  update public.viability_dimensions as d
    set weight = w.weight, updated_at = now()
  from jsonb_to_recordset(p_weights) as w(dimension text, weight numeric)
  where d.key = w.dimension;
end;
$$;

revoke all on function public.set_dimension_weights(jsonb) from public;
revoke all on function public.set_dimension_weights(jsonb) from anon;
grant execute on function public.set_dimension_weights(jsonb) to authenticated;

create or replace function public.save_validation_experiment(
  p_id uuid,
  p_type text,
  p_title text,
  p_hypothesis text,
  p_method text,
  p_target text,
  p_starts date,
  p_ends date,
  p_success text,
  p_cost text,
  p_results text,
  p_evidence text,
  p_conclusion text,
  p_outcome text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  experiment uuid;
  experiment_title text := btrim(coalesce(p_title, ''));
  experiment_hypothesis text := btrim(coalesce(p_hypothesis, ''));
  result_text text := btrim(coalesce(p_results, ''));
  evidence_text text := btrim(coalesce(p_evidence, ''));
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
  if p_type not in (
    'CUSTOMER_INTERVIEW','LANDING_PAGE','WAITLIST','PRICING_TEST','LOI','PRE_ORDER',
    'PROTOTYPE','PILOT','AD_TEST','MANUAL_SERVICE_TEST','OTHER'
  ) then
    raise exception 'invalid experiment';
  end if;
  if experiment_title = '' or char_length(experiment_title) > 200 or experiment_hypothesis = '' or char_length(experiment_hypothesis) > 4000 then
    raise exception 'invalid experiment';
  end if;
  if p_outcome is not null and p_outcome not in ('VALIDATED','PARTIALLY_VALIDATED','INVALIDATED','INCONCLUSIVE') then
    raise exception 'invalid outcome';
  end if;
  if p_ends is not null and p_starts is not null and p_ends < p_starts then
    raise exception 'invalid experiment';
  end if;

  insert into public.validation_experiments (
    application_id, title, method, created_by, experiment_type, hypothesis, target,
    starts_on, ends_on, success_criteria, cost_note, conclusion, outcome
  ) values (
    p_id,
    experiment_title,
    nullif(btrim(coalesce(p_method, '')), ''),
    auth.uid(),
    p_type,
    experiment_hypothesis,
    nullif(btrim(coalesce(p_target, '')), ''),
    p_starts,
    p_ends,
    nullif(btrim(coalesce(p_success, '')), ''),
    nullif(btrim(coalesce(p_cost, '')), ''),
    nullif(btrim(coalesce(p_conclusion, '')), ''),
    p_outcome
  )
  returning id into experiment;

  if result_text <> '' or evidence_text <> '' then
    insert into public.validation_results (experiment_id, summary, evidence)
    values (
      experiment,
      nullif(result_text, ''),
      case when evidence_text = '' then '{}'::jsonb else jsonb_build_object('note', evidence_text) end
    );
  end if;

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = p_id;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'EXPERIMENT_RECORDED',
    'idea_application',
    p_id,
    jsonb_build_object('experiment_id', experiment, 'experiment_type', p_type)
  );

  return experiment;
end;
$$;

revoke all on function public.save_validation_experiment(uuid, text, text, text, text, text, date, date, text, text, text, text, text, text) from public;
revoke all on function public.save_validation_experiment(uuid, text, text, text, text, text, date, date, text, text, text, text, text, text) from anon;
grant execute on function public.save_validation_experiment(uuid, text, text, text, text, text, date, date, text, text, text, text, text, text) to authenticated;

create or replace function public.record_committee_decision(
  p_id uuid,
  p_decision text,
  p_rationale text,
  p_conditions text,
  p_next_steps text,
  p_commercial text,
  p_technology text,
  p_review date,
  p_founder_feedback text,
  p_members uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_decision uuid;
  rationale text := btrim(coalesce(p_rationale, ''));
  conditions text := btrim(coalesce(p_conditions, ''));
  steps text := btrim(coalesce(p_next_steps, ''));
  commercial text := btrim(coalesce(p_commercial, ''));
  technology text := btrim(coalesce(p_technology, ''));
  feedback text := btrim(coalesce(p_founder_feedback, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_committee() then
    raise exception 'not staff';
  end if;
  if not exists (select 1 from public.idea_applications where id = p_id) then
    raise exception 'application not found';
  end if;
  if p_decision not in ('BUILD','PILOT','PIVOT','PARK','DECLINE') then
    raise exception 'invalid decision';
  end if;
  if rationale = '' or conditions = '' or steps = '' or commercial = '' or technology = '' or feedback = '' then
    raise exception 'invalid decision';
  end if;
  if char_length(rationale) > 4000
    or char_length(conditions) > 4000
    or char_length(steps) > 4000
    or char_length(commercial) > 4000
    or char_length(technology) > 4000
    or char_length(feedback) > 4000
  then
    raise exception 'invalid decision';
  end if;
  if p_members is null or cardinality(p_members) < 1 then
    raise exception 'invalid members';
  end if;
  if exists (
    select 1
    from unnest(p_members) as member
    where not exists (
      select 1 from public.user_roles
      where user_id = member
        and role in ('ANALYST','PRODUCT','ENGINEER','INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN')
    )
  ) then
    raise exception 'invalid members';
  end if;

  insert into public.committee_decisions (
    application_id, decision, reason, conditions, next_steps,
    commercial_notes, technology_notes, review_date, founder_feedback, created_by
  ) values (
    p_id, p_decision, rationale, conditions, steps,
    commercial, technology, p_review, feedback, auth.uid()
  )
  returning id into new_decision;

  insert into public.committee_decision_members (decision_id, user_id)
  select distinct new_decision, member
  from unnest(p_members) as member;

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = p_id;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'COMMITTEE_DECIDED',
    'idea_application',
    p_id,
    jsonb_build_object('decision_id', new_decision, 'decision', p_decision)
  );

  return new_decision;
end;
$$;

revoke all on function public.record_committee_decision(uuid, text, text, text, text, text, text, date, text, uuid[]) from public;
revoke all on function public.record_committee_decision(uuid, text, text, text, text, text, text, date, text, uuid[]) from anon;
grant execute on function public.record_committee_decision(uuid, text, text, text, text, text, text, date, text, uuid[]) to authenticated;
