-- Pesara Rails v0 (option A): metering, splitting and monthly statements.
-- No money moves here. Every in-scope revenue event of a venture produces split
-- lines; Pesara's share is collected by the venture paying a monthly statement.
-- Spec: docs/PESARA_RAILS_V0.md. Reference split engine: web/src/lib/rails/split.ts.
-- Integer minor units only (bigint). Nothing here seeds agreements or events.

-- Who may read a venture's Rails books: staff, or a founder of that venture.
create or replace function private.rails_can_read(p_venture uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_staff()
    or exists (
      select 1 from public.venture_founders vf
      where vf.venture_id = p_venture
        and vf.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.ventures v
      join public.idea_applications a on a.id = v.application_id
      where v.id = p_venture
        and a.user_id = auth.uid()
    );
$$;

revoke all on function private.rails_can_read(uuid) from public, anon;
grant execute on function private.rails_can_read(uuid) to authenticated;

-- 1. Agreement terms.
create table if not exists public.rails_agreements (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete restrict,
  equity_bps integer not null check (equity_bps between 0 and 10000),
  revenue_share_bps integer not null check (revenue_share_bps between 0 and 10000),
  tail_bps integer not null check (tail_bps between 0 and 10000),
  platform_fee_bps integer not null check (platform_fee_bps between 0 and 10000),
  build_cost_minor bigint not null check (build_cost_minor between 0 and 10000000000000),
  recovery_multiple_x100 integer not null check (recovery_multiple_x100 between 0 and 1000),
  currency text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  -- In-scope revenue kinds. Client money (contributions, savings, donations) never belongs here.
  revenue_kinds text[] not null default '{}',
  effective_from date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  agreement_document text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  activated_by uuid references auth.users (id),
  activated_at timestamptz,
  ended_at timestamptz,
  check (tail_bps <= revenue_share_bps),
  check (revenue_share_bps + platform_fee_bps <= 10000)
);

create unique index if not exists rails_agreements_one_active
  on public.rails_agreements (venture_id)
  where status = 'active';

-- 2. Revenue events. Refunds carry a negative gross and the original source_event_id in `reverses`.
create table if not exists public.rails_revenue_events (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete restrict,
  agreement_id uuid not null references public.rails_agreements (id) on delete restrict,
  source_event_id text not null check (char_length(source_event_id) between 1 and 200),
  kind text not null check (kind ~ '^[a-z0-9_.-]{1,64}$'),
  gross_minor bigint not null check (gross_minor <> 0 and abs(gross_minor) <= 10000000000000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null,
  -- Calendar month in Nairobi time; statements group on it.
  period_month date not null,
  reference text check (reference is null or char_length(reference) <= 200),
  reverses text,
  received_at timestamptz not null default now(),
  unique (venture_id, source_event_id),
  check ((reverses is null) = (gross_minor > 0))
);

create index if not exists rails_events_period on public.rails_revenue_events (venture_id, period_month);
create unique index if not exists rails_events_one_refund
  on public.rails_revenue_events (venture_id, reverses)
  where reverses is not null;

-- 3. Split lines. Lines of an event always sum to its gross.
create table if not exists public.rails_split_lines (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.rails_revenue_events (id) on delete restrict,
  venture_id uuid not null references public.ventures (id) on delete restrict,
  line text not null check (line in ('venture', 'revenue_share', 'platform_fee')),
  tier text check (tier in ('recovery', 'tail')),
  amount_minor bigint not null,
  check ((line = 'revenue_share') = (tier is not null))
);

create index if not exists rails_split_lines_event on public.rails_split_lines (event_id);
create index if not exists rails_split_lines_venture on public.rails_split_lines (venture_id, line, tier);

-- 4. Monthly statements.
create table if not exists public.rails_statements (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete restrict,
  agreement_id uuid not null references public.rails_agreements (id) on delete restrict,
  period_month date not null check (extract(day from period_month) = 1),
  currency text not null,
  event_count integer not null default 0,
  gross_minor bigint not null default 0,
  venture_minor bigint not null default 0,
  revenue_share_minor bigint not null default 0,
  platform_fee_minor bigint not null default 0,
  pesara_total_minor bigint not null default 0,
  recovered_to_date_minor bigint not null default 0,
  cap_minor bigint not null default 0,
  cap_remaining_minor bigint not null default 0,
  status text not null default 'issued' check (status in ('draft', 'issued', 'settled')),
  issued_by uuid references auth.users (id),
  issued_at timestamptz,
  settlement_reference text check (settlement_reference is null or char_length(settlement_reference) between 1 and 200),
  settled_amount_minor bigint,
  settled_by uuid references auth.users (id),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (venture_id, period_month),
  check (settled_by is null or issued_by is null or settled_by <> issued_by)
);

-- Per-venture intake secret. Only the service role (the intake endpoint) and admins can read it.
create table if not exists public.rails_venture_secrets (
  venture_id uuid primary key references public.ventures (id) on delete cascade,
  secret text not null check (char_length(secret) >= 32),
  rotated_by uuid references auth.users (id),
  rotated_at timestamptz not null default now()
);

alter table public.rails_agreements enable row level security;
alter table public.rails_revenue_events enable row level security;
alter table public.rails_split_lines enable row level security;
alter table public.rails_statements enable row level security;
alter table public.rails_venture_secrets enable row level security;

drop policy if exists rails_agreements_read on public.rails_agreements;
create policy rails_agreements_read on public.rails_agreements
  for select using (private.rails_can_read(venture_id));

drop policy if exists rails_events_read on public.rails_revenue_events;
create policy rails_events_read on public.rails_revenue_events
  for select using (private.rails_can_read(venture_id));

drop policy if exists rails_split_lines_read on public.rails_split_lines;
create policy rails_split_lines_read on public.rails_split_lines
  for select using (private.rails_can_read(venture_id));

drop policy if exists rails_statements_read on public.rails_statements;
create policy rails_statements_read on public.rails_statements
  for select using (private.rails_can_read(venture_id));

drop policy if exists rails_secrets_admin on public.rails_venture_secrets;
create policy rails_secrets_admin on public.rails_venture_secrets
  for select using (private.is_admin());

revoke all on public.rails_agreements, public.rails_revenue_events, public.rails_split_lines,
  public.rails_statements, public.rails_venture_secrets from anon, authenticated;
grant select on public.rails_agreements, public.rails_revenue_events, public.rails_split_lines,
  public.rails_statements, public.rails_venture_secrets to authenticated;
grant select on public.rails_venture_secrets to service_role;

-- Split engine. Mirrors splitRevenue() in web/src/lib/rails/split.ts exactly:
-- Pesara lines round down, the venture line is the remainder, an event crossing
-- the cap is split across the recovery and tail tiers. Numeric is used for the
-- intermediate products so nothing overflows.
create or replace function private.rails_split(
  p_gross bigint,
  p_revenue_share_bps integer,
  p_tail_bps integer,
  p_platform_fee_bps integer,
  p_cap bigint,
  p_recovered bigint
)
returns table (line text, tier text, amount_minor bigint)
language plpgsql
immutable
set search_path = public
as $$
declare
  remaining bigint := greatest(p_cap - p_recovered, 0);
  full_share bigint;
  gross_to_cap bigint;
  recovery bigint := 0;
  tail bigint := 0;
  platform bigint;
begin
  if p_gross is null or p_gross <= 0 then
    raise exception 'gross must be positive';
  end if;
  full_share := floor(p_gross::numeric * p_revenue_share_bps / 10000)::bigint;
  if remaining > 0 and full_share <= remaining then
    recovery := full_share;
  elsif remaining > 0 then
    gross_to_cap := ceil(remaining::numeric * 10000 / p_revenue_share_bps)::bigint;
    recovery := remaining;
    tail := floor((p_gross - gross_to_cap)::numeric * p_tail_bps / 10000)::bigint;
  else
    tail := floor(p_gross::numeric * p_tail_bps / 10000)::bigint;
  end if;
  platform := floor(p_gross::numeric * p_platform_fee_bps / 10000)::bigint;

  line := 'venture'; tier := null; amount_minor := p_gross - recovery - tail - platform;
  return next;
  if recovery > 0 then
    line := 'revenue_share'; tier := 'recovery'; amount_minor := recovery;
    return next;
  end if;
  if tail > 0 then
    line := 'revenue_share'; tier := 'tail'; amount_minor := tail;
    return next;
  end if;
  if platform > 0 then
    line := 'platform_fee'; tier := null; amount_minor := platform;
    return next;
  end if;
end;
$$;

revoke all on function private.rails_split(bigint, integer, integer, integer, bigint, bigint) from public, anon, authenticated;

-- Staff: create a draft agreement.
create or replace function public.rails_create_agreement(
  p_venture uuid,
  p_equity_bps integer,
  p_revenue_share_bps integer,
  p_tail_bps integer,
  p_platform_fee_bps integer,
  p_build_cost_minor bigint,
  p_recovery_multiple_x100 integer,
  p_currency text,
  p_revenue_kinds text[],
  p_effective_from date,
  p_agreement_document text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement uuid;
  kinds text[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if not exists (select 1 from public.ventures where id = p_venture) then
    raise exception 'venture not found';
  end if;
  select coalesce(array_agg(distinct k order by k), '{}')
    into kinds
    from unnest(coalesce(p_revenue_kinds, '{}')) as k
    where k is not null and btrim(k) <> '';
  if cardinality(kinds) = 0 or exists (select 1 from unnest(kinds) k where k !~ '^[a-z0-9_.-]{1,64}$') then
    raise exception 'invalid revenue kinds';
  end if;
  if p_effective_from is null then
    raise exception 'invalid agreement';
  end if;

  insert into public.rails_agreements (
    venture_id, equity_bps, revenue_share_bps, tail_bps, platform_fee_bps,
    build_cost_minor, recovery_multiple_x100, currency, revenue_kinds,
    effective_from, agreement_document, created_by
  ) values (
    p_venture, p_equity_bps, p_revenue_share_bps, p_tail_bps, p_platform_fee_bps,
    p_build_cost_minor, p_recovery_multiple_x100, upper(btrim(coalesce(p_currency, 'KES'))), kinds,
    p_effective_from, nullif(btrim(coalesce(p_agreement_document, '')), ''), auth.uid()
  )
  returning id into agreement;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'RAILS_AGREEMENT_DRAFTED', 'venture', p_venture, jsonb_build_object('agreement_id', agreement));

  return agreement;
end;
$$;

revoke all on function public.rails_create_agreement(uuid, integer, integer, integer, integer, bigint, integer, text, text[], date, text) from public, anon;
grant execute on function public.rails_create_agreement(uuid, integer, integer, integer, integer, bigint, integer, text, text[], date, text) to authenticated;

-- Staff: activate a draft. Four eyes: whoever drafted the terms cannot activate them.
-- The previous active agreement for the venture ends.
create or replace function public.rails_activate_agreement(p_agreement uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.rails_agreements%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  select * into rec from public.rails_agreements where id = p_agreement for update;
  if not found then
    raise exception 'agreement not found';
  end if;
  if rec.status <> 'draft' then
    raise exception 'agreement is not a draft';
  end if;
  if rec.created_by = auth.uid() then
    raise exception 'a second person must activate the agreement';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('rails:' || rec.venture_id::text, 0));

  update public.rails_agreements
    set status = 'ended', ended_at = now()
    where venture_id = rec.venture_id and status = 'active';
  update public.rails_agreements
    set status = 'active', activated_by = auth.uid(), activated_at = now()
    where id = p_agreement;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'RAILS_AGREEMENT_ACTIVATED', 'venture', rec.venture_id, jsonb_build_object('agreement_id', p_agreement));
end;
$$;

revoke all on function public.rails_activate_agreement(uuid) from public, anon;
grant execute on function public.rails_activate_agreement(uuid) to authenticated;

-- Admin: set or rotate a venture's intake secret. The old secret stops working at once.
create or replace function public.rails_rotate_secret(p_venture uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'not admin';
  end if;
  if not exists (select 1 from public.ventures where id = p_venture) then
    raise exception 'venture not found';
  end if;
  insert into public.rails_venture_secrets (venture_id, secret, rotated_by, rotated_at)
  values (p_venture, fresh, auth.uid(), now())
  on conflict (venture_id) do update
    set secret = excluded.secret, rotated_by = excluded.rotated_by, rotated_at = excluded.rotated_at;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'RAILS_SECRET_ROTATED', 'venture', p_venture, '{}'::jsonb);
end;
$$;

revoke all on function public.rails_rotate_secret(uuid) from public, anon;
grant execute on function public.rails_rotate_secret(uuid) to authenticated;

-- Service role only: record one revenue event and its split lines, idempotently.
-- Re-sending a source_event_id returns the stored event and writes nothing.
create or replace function public.rails_record_event(
  p_venture uuid,
  p_source_event_id text,
  p_kind text,
  p_gross_minor bigint,
  p_currency text,
  p_occurred_at timestamptz,
  p_reference text,
  p_reverses text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement public.rails_agreements%rowtype;
  existing public.rails_revenue_events%rowtype;
  original public.rails_revenue_events%rowtype;
  new_event uuid;
  recovered bigint;
  cap bigint;
  reverses_id text := nullif(btrim(coalesce(p_reverses, '')), '');
begin
  if p_venture is null or p_source_event_id is null then
    raise exception 'invalid event';
  end if;
  -- Serialise every event of the venture, so the recovered amount each split
  -- sees is exact and duplicates cannot race. Activation takes the same lock.
  perform pg_advisory_xact_lock(hashtextextended('rails:' || p_venture::text, 0));

  -- A retry is answered before anything else, even if the agreement has since changed.
  select * into existing
  from public.rails_revenue_events
  where venture_id = p_venture and source_event_id = p_source_event_id;
  if found then
    if existing.gross_minor is distinct from p_gross_minor
      or existing.currency is distinct from p_currency
      or existing.reverses is distinct from reverses_id then
      raise exception 'source_event_id reused with a different event';
    end if;
    return jsonb_build_object('event_id', existing.id, 'duplicate', true);
  end if;

  select * into agreement
  from public.rails_agreements
  where venture_id = p_venture and status = 'active';
  if not found then
    raise exception 'no active agreement';
  end if;

  if p_currency is distinct from agreement.currency then
    raise exception 'currency does not match the agreement';
  end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '1 day' then
    raise exception 'invalid occurred_at';
  end if;
  if p_gross_minor is null or p_gross_minor = 0 then
    raise exception 'invalid gross';
  end if;

  if reverses_id is null then
    if p_gross_minor < 0 then
      raise exception 'a refund must name the event it reverses';
    end if;
    if not (p_kind = any (agreement.revenue_kinds)) then
      raise exception 'kind is not in scope for this agreement';
    end if;
  else
    if p_gross_minor > 0 then
      raise exception 'a refund must have a negative gross';
    end if;
    select * into original
    from public.rails_revenue_events
    where venture_id = p_venture and source_event_id = reverses_id;
    if not found or original.reverses is not null then
      raise exception 'refund must reverse a recorded revenue event';
    end if;
    if p_gross_minor <> -original.gross_minor then
      raise exception 'v0 accepts full refunds only';
    end if;
    if exists (
      select 1 from public.rails_revenue_events
      where venture_id = p_venture and reverses = reverses_id
    ) then
      raise exception 'event already refunded';
    end if;
  end if;

  insert into public.rails_revenue_events (
    venture_id, agreement_id, source_event_id, kind, gross_minor, currency,
    occurred_at, period_month, reference, reverses
  ) values (
    p_venture, agreement.id, p_source_event_id, p_kind, p_gross_minor, p_currency,
    p_occurred_at, date_trunc('month', p_occurred_at at time zone 'Africa/Nairobi')::date,
    nullif(btrim(coalesce(p_reference, '')), ''), reverses_id
  )
  returning id into new_event;

  if reverses_id is null then
    select coalesce(sum(l.amount_minor), 0) into recovered
    from public.rails_split_lines l
    where l.venture_id = p_venture and l.line = 'revenue_share' and l.tier = 'recovery';
    cap := floor(agreement.build_cost_minor::numeric * agreement.recovery_multiple_x100 / 100)::bigint;

    insert into public.rails_split_lines (event_id, venture_id, line, tier, amount_minor)
    select new_event, p_venture, s.line, s.tier, s.amount_minor
    from private.rails_split(
      p_gross_minor,
      agreement.revenue_share_bps,
      agreement.tail_bps,
      agreement.platform_fee_bps,
      cap,
      recovered
    ) s;
  else
    insert into public.rails_split_lines (event_id, venture_id, line, tier, amount_minor)
    select new_event, p_venture, l.line, l.tier, -l.amount_minor
    from public.rails_split_lines l
    where l.event_id = original.id;
  end if;

  return jsonb_build_object('event_id', new_event, 'duplicate', false);
end;
$$;

revoke all on function public.rails_record_event(uuid, text, text, bigint, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.rails_record_event(uuid, text, text, bigint, text, timestamptz, text, text) to service_role;

-- Staff: issue the statement for a closed month (Nairobi time).
create or replace function public.rails_issue_statement(p_venture uuid, p_month date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement public.rails_agreements%rowtype;
  month_start date := date_trunc('month', p_month)::date;
  new_statement uuid;
  cap bigint;
  recovered bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if p_month is null or month_start >= date_trunc('month', now() at time zone 'Africa/Nairobi')::date then
    raise exception 'month has not closed';
  end if;
  select * into agreement
  from public.rails_agreements
  where venture_id = p_venture and status = 'active';
  if not found then
    raise exception 'no active agreement';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('rails:' || p_venture::text, 0));
  if exists (select 1 from public.rails_statements where venture_id = p_venture and period_month = month_start) then
    raise exception 'statement already issued';
  end if;

  cap := floor(agreement.build_cost_minor::numeric * agreement.recovery_multiple_x100 / 100)::bigint;
  select coalesce(sum(l.amount_minor), 0) into recovered
  from public.rails_split_lines l
  join public.rails_revenue_events e on e.id = l.event_id
  where l.venture_id = p_venture and l.line = 'revenue_share' and l.tier = 'recovery'
    and e.period_month <= month_start;

  insert into public.rails_statements (
    venture_id, agreement_id, period_month, currency, event_count, gross_minor,
    venture_minor, revenue_share_minor, platform_fee_minor, pesara_total_minor,
    recovered_to_date_minor, cap_minor, cap_remaining_minor, status, issued_by, issued_at
  )
  select
    p_venture, agreement.id, month_start, agreement.currency,
    (select count(*) from public.rails_revenue_events e where e.venture_id = p_venture and e.period_month = month_start),
    (select coalesce(sum(e.gross_minor), 0) from public.rails_revenue_events e where e.venture_id = p_venture and e.period_month = month_start),
    coalesce(sum(l.amount_minor) filter (where l.line = 'venture'), 0),
    coalesce(sum(l.amount_minor) filter (where l.line = 'revenue_share'), 0),
    coalesce(sum(l.amount_minor) filter (where l.line = 'platform_fee'), 0),
    coalesce(sum(l.amount_minor) filter (where l.line <> 'venture'), 0),
    recovered, cap, greatest(cap - recovered, 0), 'issued', auth.uid(), now()
  from public.rails_split_lines l
  join public.rails_revenue_events e on e.id = l.event_id
  where e.venture_id = p_venture and e.period_month = month_start
  returning id into new_statement;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'RAILS_STATEMENT_ISSUED', 'venture', p_venture, jsonb_build_object('statement_id', new_statement, 'month', month_start));

  return new_statement;
end;
$$;

revoke all on function public.rails_issue_statement(uuid, date) from public, anon;
grant execute on function public.rails_issue_statement(uuid, date) to authenticated;

-- Staff: mark an issued statement settled. Four eyes: the issuer cannot settle,
-- and the amount received must equal Pesara's lines on the statement.
create or replace function public.rails_settle_statement(p_statement uuid, p_reference text, p_amount_minor bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.rails_statements%rowtype;
  ref text := btrim(coalesce(p_reference, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if ref = '' or char_length(ref) > 200 then
    raise exception 'invalid reference';
  end if;
  select * into rec from public.rails_statements where id = p_statement for update;
  if not found then
    raise exception 'statement not found';
  end if;
  if rec.status <> 'issued' then
    raise exception 'statement is not open';
  end if;
  if rec.issued_by = auth.uid() then
    raise exception 'a second person must settle the statement';
  end if;
  if p_amount_minor is distinct from rec.pesara_total_minor then
    raise exception 'settled amount does not match the statement';
  end if;

  update public.rails_statements
    set status = 'settled',
        settlement_reference = ref,
        settled_amount_minor = p_amount_minor,
        settled_by = auth.uid(),
        settled_at = now()
    where id = p_statement;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (auth.uid(), 'RAILS_STATEMENT_SETTLED', 'venture', rec.venture_id, jsonb_build_object('statement_id', p_statement));
end;
$$;

revoke all on function public.rails_settle_statement(uuid, text, bigint) from public, anon;
grant execute on function public.rails_settle_statement(uuid, text, bigint) to authenticated;

-- Header for the Rails pages: the venture name (founders cannot read public.ventures),
-- recovery to date over every event, and per-month totals of the current lines
-- so statements can be reconciled without loading every event.
create or replace function public.rails_venture_summary(p_venture uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  venture_name text;
begin
  if auth.uid() is null or p_venture is null or not private.rails_can_read(p_venture) then
    return null;
  end if;
  select v.name into venture_name from public.ventures v where v.id = p_venture;
  if venture_name is null then
    return null;
  end if;
  return jsonb_build_object(
    'name', venture_name,
    'event_count', (select count(*) from public.rails_revenue_events e where e.venture_id = p_venture),
    'recovered_minor', (
      select coalesce(sum(l.amount_minor), 0) from public.rails_split_lines l
      where l.venture_id = p_venture and l.line = 'revenue_share' and l.tier = 'recovery'
    ),
    'months', coalesce((
      select jsonb_agg(m order by m.period_month desc)
      from (
        select
          e.period_month,
          count(distinct e.id) as event_count,
          (select coalesce(sum(x.gross_minor), 0) from public.rails_revenue_events x where x.venture_id = p_venture and x.period_month = e.period_month) as gross_minor,
          coalesce(sum(l.amount_minor) filter (where l.line = 'venture'), 0) as venture_minor,
          coalesce(sum(l.amount_minor) filter (where l.line = 'revenue_share'), 0) as revenue_share_minor,
          coalesce(sum(l.amount_minor) filter (where l.line = 'platform_fee'), 0) as platform_fee_minor,
          coalesce(sum(l.amount_minor) filter (where l.line <> 'venture'), 0) as pesara_total_minor
        from public.rails_revenue_events e
        left join public.rails_split_lines l on l.event_id = e.id
        where e.venture_id = p_venture
        group by e.period_month
      ) m
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.rails_venture_summary(uuid) from public, anon;
grant execute on function public.rails_venture_summary(uuid) to authenticated;
