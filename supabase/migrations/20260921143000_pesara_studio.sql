-- Pesara Limited core schema. Production starts empty. No fabricated portfolio.

create extension if not exists "pgcrypto";

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  country text,
  city text,
  linkedin_url text,
  occupation text,
  referral_code text unique,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in (
    'FOUNDER','ANALYST','PRODUCT','ENGINEER','INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN'
  )),
  created_at timestamptz not null default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  one_liner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_applications (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  reference text not null unique,
  payload jsonb not null default '{}'::jsonb,
  stage text not null default 'submitted' check (stage in (
    'draft','submitted','screening','interview','validation','committee',
    'structuring','building','live','parked','declined'
  )),
  country text,
  industry text,
  assigned_analyst uuid references auth.users (id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  actor uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  user_id uuid references auth.users (id),
  path text not null,
  mime_type text,
  byte_size int,
  created_at timestamptz not null default now()
);

create table public.application_team_members (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  full_name text,
  role text,
  created_at timestamptz not null default now()
);

create table public.viability_dimensions (
  key text primary key,
  label text not null,
  category text not null,
  weight numeric not null default 1,
  updated_at timestamptz not null default now()
);

create table public.viability_assessments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  version int not null default 1,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (application_id, version)
);

create table public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.viability_assessments (id) on delete cascade,
  dimension text not null references public.viability_dimensions (key),
  score int check (score between 1 and 5),
  analyst_note text,
  created_at timestamptz not null default now()
);

create table public.committee_decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  decision text not null check (decision in ('BUILD','PILOT','PIVOT','PARK','DECLINE')),
  reason text,
  committee_notes text,
  conditions text,
  next_steps text,
  review_date date,
  founder_feedback text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.validation_experiments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  title text not null,
  method text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.validation_results (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.validation_experiments (id) on delete cascade,
  summary text,
  evidence jsonb,
  created_at timestamptz not null default now()
);

create table public.ventures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  industry text,
  country text,
  stage text,
  website text,
  status text check (status in ('VALIDATING','BUILDING','LIVE','SCALING','EXITED','PAUSED')),
  pesara_relationship text check (pesara_relationship in (
    'built_by_pesara','pesara_company','technology_by_pesara','none'
  )),
  public_visible boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venture_founders (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  user_id uuid references auth.users (id),
  full_name text,
  created_at timestamptz not null default now()
);

create table public.venture_metrics (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  key text not null,
  label text not null,
  unique (venture_id, key)
);

create table public.venture_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.venture_metrics (id) on delete cascade,
  value_cents bigint,
  value_numeric numeric,
  captured_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.venture_documents (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  path text not null,
  title text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.venture_milestones (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  title text not null,
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.idea_applications (id) on delete cascade,
  sender uuid references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  country text,
  interests text,
  persona text,
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null unique,
  invites int not null default 0,
  applications_referred int not null default 0,
  accepted_referred int not null default 0,
  created_at timestamptz not null default now()
);

create table public.article_categories (
  slug text primary key,
  label text not null
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text,
  category text references public.article_categories (slug),
  published boolean not null default false,
  author_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  inquiry_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  kind text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('export','deletion')),
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users (id),
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid not null,
  body text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

insert into public.article_categories (slug, label) values
  ('ideas', 'Ideas'),
  ('technology', 'Technology'),
  ('startups', 'Startups'),
  ('markets', 'Markets'),
  ('africa', 'Africa'),
  ('product', 'Product'),
  ('capital', 'Capital'),
  ('research', 'Research'),
  ('founder-stories', 'Founder Stories');

insert into public.viability_dimensions (key, label, category) values
  ('problem_severity', 'Severity', 'Problem'),
  ('problem_frequency', 'Frequency', 'Problem'),
  ('problem_urgency', 'Urgency', 'Problem'),
  ('problem_alternatives', 'Existing alternatives', 'Problem'),
  ('customer_clarity', 'Customer clarity', 'Customer'),
  ('customer_access', 'Accessibility', 'Customer'),
  ('customer_wtp', 'Willingness to pay', 'Customer'),
  ('market_size', 'Market size', 'Market'),
  ('market_growth', 'Growth potential', 'Market'),
  ('market_geo', 'Geographic expansion', 'Market'),
  ('comp_intensity', 'Competitive intensity', 'Competition'),
  ('comp_diff', 'Differentiation', 'Competition'),
  ('comp_switch', 'Switching incentives', 'Competition'),
  ('model_revenue', 'Revenue clarity', 'Business Model'),
  ('model_margins', 'Margins', 'Business Model'),
  ('model_recurring', 'Recurring revenue potential', 'Business Model'),
  ('model_unit', 'Unit economics', 'Business Model'),
  ('dist_path', 'Customer acquisition path', 'Distribution'),
  ('dist_partners', 'Partnership opportunities', 'Distribution'),
  ('dist_network', 'Network effects', 'Distribution'),
  ('tech_feasibility', 'Technical feasibility', 'Technology'),
  ('tech_complexity', 'Development complexity', 'Technology'),
  ('tech_infra', 'Infrastructure cost', 'Technology'),
  ('tech_security', 'Security complexity', 'Technology'),
  ('reg_licensing', 'Licensing', 'Regulation'),
  ('reg_data', 'Data protection', 'Regulation'),
  ('reg_finance', 'Financial regulation', 'Regulation'),
  ('reg_sector', 'Sector-specific regulation', 'Regulation'),
  ('founder_domain', 'Domain expertise', 'Founder'),
  ('founder_execution', 'Execution capacity', 'Founder'),
  ('founder_network', 'Network', 'Founder'),
  ('founder_commit', 'Commitment', 'Founder'),
  ('evidence_interviews', 'Customer interviews', 'Evidence'),
  ('evidence_users', 'Users', 'Evidence'),
  ('evidence_revenue', 'Revenue', 'Evidence'),
  ('evidence_lois', 'LOIs', 'Evidence'),
  ('evidence_pilots', 'Pilots', 'Evidence'),
  ('evidence_preorders', 'Pre-orders', 'Evidence'),
  ('def_data', 'Data advantage', 'Defensibility'),
  ('def_network', 'Network effects', 'Defensibility'),
  ('def_tech', 'Technology', 'Defensibility'),
  ('def_brand', 'Brand', 'Defensibility'),
  ('def_dist', 'Distribution', 'Defensibility'),
  ('def_switch', 'Switching costs', 'Defensibility'),
  ('def_reg', 'Regulatory position', 'Defensibility'),
  ('fit_tech', 'Technology fit', 'Pesara Fit'),
  ('fit_strategy', 'Strategic fit', 'Pesara Fit'),
  ('fit_resources', 'Resource requirement', 'Pesara Fit'),
  ('fit_economics', 'Potential economics', 'Pesara Fit');

insert into public.system_settings (key, value, is_public) values
  ('public_metrics', '{"ideas_submitted": true, "under_review": true, "validation_sprints": true, "products_built": true, "ventures_launched": true, "revenue_generating": true}'::jsonb, true);

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('ANALYST','PRODUCT','ENGINEER','INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN')
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  code := 'PESARA-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));
  insert into public.profiles (id, full_name, referral_code)
  values (new.id, new.raw_user_meta_data ->> 'full_name', code);
  insert into public.user_roles (user_id, role) values (new.id, 'FOUNDER');
  insert into public.referrals (user_id, code) values (new.id, code);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Founders never read committee_notes / internal reason through this table.
create or replace function public.founder_decision_view(p_application_id uuid)
returns table (
  decision text,
  founder_feedback text,
  next_steps text,
  review_date date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select d.decision, d.founder_feedback, d.next_steps, d.review_date, d.created_at
  from public.committee_decisions d
  join public.idea_applications a on a.id = d.application_id
  where d.application_id = p_application_id
    and a.user_id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_team_members enable row level security;
alter table public.viability_dimensions enable row level security;
alter table public.viability_assessments enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.committee_decisions enable row level security;
alter table public.validation_experiments enable row level security;
alter table public.validation_results enable row level security;
alter table public.ventures enable row level security;
alter table public.venture_founders enable row level security;
alter table public.venture_metrics enable row level security;
alter table public.venture_metric_snapshots enable row level security;
alter table public.venture_documents enable row level security;
alter table public.venture_milestones enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.waitlist enable row level security;
alter table public.referrals enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.inquiries enable row level security;
alter table public.consent_events enable row level security;
alter table public.data_requests enable row level security;
alter table public.activity_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.admin_notes enable row level security;

create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff on public.profiles
  for select using (private.is_staff());

create policy ideas_owner on public.ideas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ideas_staff on public.ideas
  for all using (private.is_staff()) with check (private.is_staff());

create policy applications_owner on public.idea_applications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy applications_staff on public.idea_applications
  for all using (private.is_staff()) with check (private.is_staff());

create policy history_owner on public.application_status_history
  for select using (
    exists (select 1 from public.idea_applications a where a.id = application_id and a.user_id = auth.uid())
  );
create policy history_staff on public.application_status_history
  for all using (private.is_staff()) with check (private.is_staff());

create policy documents_owner on public.application_documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy documents_staff on public.application_documents
  for all using (private.is_staff()) with check (private.is_staff());

create policy team_owner on public.application_team_members
  for all using (
    exists (select 1 from public.idea_applications a where a.id = application_id and a.user_id = auth.uid())
  );
create policy team_staff on public.application_team_members
  for all using (private.is_staff()) with check (private.is_staff());

create policy dimensions_read on public.viability_dimensions for select using (private.is_staff());
create policy dimensions_staff on public.viability_dimensions for all using (private.is_staff()) with check (private.is_staff());
create policy assessments_staff on public.viability_assessments for all using (private.is_staff()) with check (private.is_staff());
create policy scores_staff on public.assessment_scores for all using (private.is_staff()) with check (private.is_staff());
create policy decisions_staff on public.committee_decisions for all using (private.is_staff()) with check (private.is_staff());
create policy experiments_staff on public.validation_experiments for all using (private.is_staff()) with check (private.is_staff());
create policy results_staff on public.validation_results for all using (private.is_staff()) with check (private.is_staff());

create policy ventures_public on public.ventures
  for select using (public_visible = true and is_demo = false);
create policy ventures_staff on public.ventures
  for all using (private.is_staff()) with check (private.is_staff());
create policy venture_founders_self on public.venture_founders
  for select using (user_id = auth.uid() or private.is_staff());
create policy venture_founders_staff on public.venture_founders
  for all using (private.is_staff()) with check (private.is_staff());
create policy venture_metrics_staff on public.venture_metrics for all using (private.is_staff()) with check (private.is_staff());
create policy venture_snapshots_staff on public.venture_metric_snapshots for all using (private.is_staff()) with check (private.is_staff());
create policy venture_docs_staff on public.venture_documents for all using (private.is_staff()) with check (private.is_staff());
create policy venture_milestones_staff on public.venture_milestones for all using (private.is_staff()) with check (private.is_staff());

create policy messages_participants on public.messages
  for select using (
    sender = auth.uid() or private.is_staff() or exists (
      select 1 from public.idea_applications a where a.id = application_id and a.user_id = auth.uid()
    )
  );
create policy messages_insert on public.messages
  for insert with check (sender = auth.uid() or private.is_staff());

create policy notifications_self on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy articles_public on public.articles for select using (published = true);
create policy articles_staff on public.articles for all using (private.is_staff()) with check (private.is_staff());
create policy categories_public on public.article_categories for select using (true);

create policy waitlist_insert on public.waitlist for insert with check (true);
create policy waitlist_staff on public.waitlist for select using (private.is_staff());

create policy inquiries_insert on public.inquiries for insert with check (true);
create policy inquiries_staff on public.inquiries for select using (private.is_staff());

create policy referrals_self on public.referrals for select using (user_id = auth.uid() or private.is_staff());
create policy consent_self on public.consent_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy data_requests_self on public.data_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy settings_public_read on public.system_settings for select using (is_public = true);
create policy settings_staff on public.system_settings for all using (private.is_staff()) with check (private.is_staff());
create policy notes_staff on public.admin_notes for all using (private.is_staff()) with check (private.is_staff());
create policy logs_staff on public.activity_logs for select using (private.is_staff());
create policy logs_insert_staff on public.activity_logs for insert with check (private.is_staff());
create policy roles_self on public.user_roles for select using (user_id = auth.uid() or private.is_staff());

revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;
grant execute on function public.founder_decision_view(uuid) to authenticated;

create index idea_applications_user_idx on public.idea_applications (user_id);
create index idea_applications_stage_idx on public.idea_applications (stage);
create index ideas_user_idx on public.ideas (user_id);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity, entity_id);
