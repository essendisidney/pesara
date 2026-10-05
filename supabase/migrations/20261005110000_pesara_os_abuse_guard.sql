-- Abuse guard for the public, anonymous forms (waitlist, inquiries, referral visits)
-- and first-party product analytics.
--
-- Limits are enforced in Postgres so they hold even when someone calls the RPCs
-- directly with the publishable key and skips the website.

create table if not exists public.abuse_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  hit_at timestamptz not null default now()
);

create index if not exists abuse_hits_bucket_subject_at on public.abuse_hits (bucket, subject, hit_at desc);
create index if not exists abuse_hits_at on public.abuse_hits (hit_at);

alter table public.abuse_hits enable row level security;
revoke all on table public.abuse_hits from public, anon, authenticated;

-- Records one hit and raises 'rate limited' when the subject already has p_max
-- hits in the window. Lives in the private schema: never callable through the API.
create or replace function private.abuse_guard(
  p_bucket text,
  p_subject text,
  p_max int,
  p_window interval
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.abuse_hits
  where bucket = p_bucket
    and subject = p_subject
    and hit_at > now() - p_window;

  if recent >= p_max then
    raise exception 'rate limited' using errcode = 'P0001';
  end if;

  insert into public.abuse_hits (bucket, subject) values (p_bucket, p_subject);

  -- Keep the table small. Nothing needs hits older than a day.
  if random() < 0.01 then
    delete from public.abuse_hits where hit_at < now() - interval '1 day';
  end if;
end;
$$;

revoke all on function private.abuse_guard(text, text, int, interval) from public, anon, authenticated;

-- Waitlist: 5 writes per address per hour, 300 new entries per hour overall.
create or replace function private.waitlist_abuse_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.abuse_guard('waitlist:email', lower(new.email), 5, interval '1 hour');
  if tg_op = 'INSERT' then
    perform private.abuse_guard('waitlist:all', 'all', 300, interval '1 hour');
  end if;
  return new;
end;
$$;

drop trigger if exists waitlist_abuse_guard on public.waitlist;
create trigger waitlist_abuse_guard
  before insert or update of name, country, interests, persona on public.waitlist
  for each row execute function private.waitlist_abuse_guard();

-- Inquiries: 5 per address per hour, 200 per hour overall.
create or replace function private.inquiry_abuse_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.abuse_guard('inquiry:email', lower(new.email), 5, interval '1 hour');
  perform private.abuse_guard('inquiry:all', 'all', 200, interval '1 hour');
  return new;
end;
$$;

drop trigger if exists inquiry_abuse_guard on public.inquiries;
create trigger inquiry_abuse_guard
  before insert on public.inquiries
  for each row execute function private.inquiry_abuse_guard();

revoke all on function private.waitlist_abuse_guard() from public, anon, authenticated;
revoke all on function private.inquiry_abuse_guard() from public, anon, authenticated;

-- Waitlist unsubscribe by private token instead of by address, so nobody can
-- remove someone else. The token only travels in email Pesara sends.
alter table public.waitlist
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists waitlist_unsubscribe_token on public.waitlist (unsubscribe_token);

create or replace function public.leave_waitlist_by_token(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  touched int;
begin
  if p_token is null then
    return false;
  end if;
  update public.waitlist
    set unsubscribed_at = now()
    where unsubscribe_token = p_token
      and unsubscribed_at is null;
  get diagnostics touched = row_count;
  return touched > 0;
end;
$$;

revoke all on function public.leave_waitlist_by_token(uuid) from public, anon, authenticated;
grant execute on function public.leave_waitlist_by_token(uuid) to anon, authenticated;

-- The address-based leave stays for staff tooling only.
revoke execute on function public.leave_waitlist(text) from anon, authenticated;

-- First-party analytics. Names are allow-listed; no personal data is stored.
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null,
  path text,
  props jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_at on public.analytics_events (name, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from public, anon, authenticated;
grant select on table public.analytics_events to authenticated;

drop policy if exists analytics_events_staff_read on public.analytics_events;
create policy analytics_events_staff_read on public.analytics_events
  for select to authenticated
  using (private.is_staff());

create or replace function public.record_event(p_name text, p_path text, p_props jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name not in (
    'homepage_view', 'submit_idea_clicked', 'application_started', 'application_step_completed',
    'application_submitted', 'account_created', 'portfolio_viewed', 'service_enquiry',
    'waitlist_joined', 'referral_used'
  ) then
    raise exception 'invalid event';
  end if;
  if p_path is not null and char_length(p_path) > 200 then
    raise exception 'invalid event';
  end if;
  if p_props is not null and (jsonb_typeof(p_props) <> 'object' or char_length(p_props::text) > 1000) then
    raise exception 'invalid event';
  end if;

  perform private.abuse_guard('event:all', 'all', 20000, interval '1 hour');

  insert into public.analytics_events (name, path, props, user_id)
  values (p_name, p_path, coalesce(p_props, '{}'::jsonb), auth.uid());
end;
$$;

revoke all on function public.record_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_event(text, text, jsonb) to anon, authenticated;
