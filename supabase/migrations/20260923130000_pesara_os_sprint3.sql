-- Sprint 3: viability scores, validation experiments, and committee decisions.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('ADMIN','SUPER_ADMIN')
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.is_committee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN')
  );
$$;

revoke all on function private.is_committee() from public;
revoke all on function private.is_committee() from anon;
grant execute on function private.is_committee() to authenticated;

do $$
begin
  if not exists (select 1 from public.assessment_scores) then
    delete from public.viability_dimensions;
  end if;
end $$;

insert into public.viability_dimensions (key, label, category, weight) values
  ('problem_severity', 'Severity', 'Problem', 1),
  ('problem_frequency', 'Frequency', 'Problem', 1),
  ('problem_urgency', 'Urgency', 'Problem', 1),
  ('problem_friction', 'Current friction', 'Problem', 1),
  ('customer_clarity', 'Clarity', 'Customer', 1),
  ('customer_access', 'Accessibility', 'Customer', 1),
  ('customer_need', 'Need', 'Customer', 1),
  ('customer_wtp', 'Willingness to pay', 'Customer', 1),
  ('market_depth', 'Market depth', 'Market', 1),
  ('market_growth', 'Growth potential', 'Market', 1),
  ('market_expansion', 'Expansion potential', 'Market', 1),
  ('comp_alternatives', 'Existing alternatives', 'Competition', 1),
  ('comp_intensity', 'Competitive intensity', 'Competition', 1),
  ('comp_diff', 'Differentiation', 'Competition', 1),
  ('model_revenue', 'Revenue clarity', 'Business model', 1),
  ('model_pricing', 'Pricing logic', 'Business model', 1),
  ('model_margins', 'Margin potential', 'Business model', 1),
  ('model_recurring', 'Recurring revenue potential', 'Business model', 1),
  ('dist_path', 'Customer acquisition path', 'Distribution', 1),
  ('dist_existing', 'Existing distribution', 'Distribution', 1),
  ('dist_partners', 'Partnership potential', 'Distribution', 1),
  ('evidence_interviews', 'Customer interviews', 'Evidence', 1),
  ('evidence_users', 'Users', 'Evidence', 1),
  ('evidence_revenue', 'Revenue', 'Evidence', 1),
  ('evidence_lois', 'LOIs', 'Evidence', 1),
  ('evidence_waitlist', 'Waitlist', 'Evidence', 1),
  ('evidence_pilots', 'Pilots', 'Evidence', 1),
  ('evidence_preorders', 'Pre-orders', 'Evidence', 1),
  ('founder_domain', 'Domain expertise', 'Founder', 1),
  ('founder_execution', 'Execution ability', 'Founder', 1),
  ('founder_network', 'Network', 'Founder', 1),
  ('founder_commit', 'Commitment', 'Founder', 1),
  ('tech_feasibility', 'Feasibility', 'Technology', 1),
  ('tech_complexity', 'Complexity', 'Technology', 1),
  ('tech_cost', 'Development cost', 'Technology', 1),
  ('tech_infra', 'Infrastructure burden', 'Technology', 1),
  ('reg_licensing', 'Licensing', 'Regulation', 1),
  ('reg_data', 'Data protection', 'Regulation', 1),
  ('reg_sector', 'Sector regulation', 'Regulation', 1),
  ('reg_finance', 'Financial regulation', 'Regulation', 1),
  ('def_data', 'Data', 'Defensibility', 1),
  ('def_network', 'Network effects', 'Defensibility', 1),
  ('def_brand', 'Brand', 'Defensibility', 1),
  ('def_dist', 'Distribution', 'Defensibility', 1),
  ('def_tech', 'Technology', 'Defensibility', 1),
  ('def_switch', 'Switching costs', 'Defensibility', 1),
  ('def_reg', 'Regulatory advantage', 'Defensibility', 1),
  ('fit_improve', 'Material improvement', 'Pesara fit', 1),
  ('fit_capability', 'Relevant capabilities', 'Pesara fit', 1),
  ('fit_resources', 'Required resources', 'Pesara fit', 1),
  ('fit_economics', 'Potential economics', 'Pesara fit', 1),
  ('fit_strategy', 'Strategic relevance', 'Pesara fit', 1)
on conflict (key) do update
  set label = excluded.label,
      category = excluded.category;

alter table public.validation_experiments
  add column if not exists experiment_type text,
  add column if not exists hypothesis text,
  add column if not exists target text,
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists success_criteria text,
  add column if not exists cost_note text,
  add column if not exists conclusion text,
  add column if not exists outcome text;

alter table public.validation_experiments
  drop constraint if exists validation_experiments_outcome_check;

alter table public.validation_experiments
  add constraint validation_experiments_outcome_check
  check (
    outcome is null
    or outcome in ('VALIDATED','PARTIALLY_VALIDATED','INVALIDATED','INCONCLUSIVE')
  );

alter table public.committee_decisions
  add column if not exists commercial_notes text,
  add column if not exists technology_notes text;

create table if not exists public.committee_decision_members (
  decision_id uuid not null references public.committee_decisions (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  primary key (decision_id, user_id)
);

alter table public.committee_decision_members enable row level security;

drop policy if exists decision_members_staff on public.committee_decision_members;
create policy decision_members_staff on public.committee_decision_members
  for all using (private.is_staff()) with check (private.is_staff());

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
