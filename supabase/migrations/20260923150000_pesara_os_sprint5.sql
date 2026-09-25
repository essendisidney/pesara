-- Sprint 5: referral attribution and a public pipeline that only returns published counts.

alter table public.profiles
  add column if not exists referred_by uuid references auth.users (id);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind text not null check (kind in ('visitor', 'registration', 'application', 'accepted')),
  subject_user uuid,
  application_id uuid,
  venture_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists referral_events_code_idx on public.referral_events (code);

alter table public.referral_events enable row level security;

drop policy if exists referral_events_staff on public.referral_events;
create policy referral_events_staff on public.referral_events
  for select using (private.is_staff());

drop policy if exists referral_events_owner on public.referral_events;
create policy referral_events_owner on public.referral_events
  for select using (
    exists (
      select 1 from public.referrals
      where referrals.code = referral_events.code
        and referrals.user_id = auth.uid()
    )
  );

update public.system_settings
set value = jsonb_build_object(
  'ideas_submitted', false,
  'under_review', false,
  'in_validation', false,
  'being_built', false,
  'launched', false
)
where key = 'public_metrics';

create or replace function public.note_referral_visit(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text := upper(btrim(coalesce(p_code, '')));
begin
  if clean !~ '^PESARA-[A-Z0-9-]{4,40}$' then
    return false;
  end if;
  if not exists (select 1 from public.referrals where code = clean) then
    return false;
  end if;
  insert into public.referral_events (code, kind)
  values (clean, 'visitor');
  return true;
end;
$$;

revoke all on function public.note_referral_visit(text) from public;
grant execute on function public.note_referral_visit(text) to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  own_code text;
  incoming text := upper(btrim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));
  referrer uuid;
begin
  own_code := 'PESARA-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));
  insert into public.profiles (id, full_name, referral_code)
  values (new.id, new.raw_user_meta_data ->> 'full_name', own_code);
  insert into public.user_roles (user_id, role) values (new.id, 'FOUNDER');
  insert into public.referrals (user_id, code) values (new.id, own_code);

  if incoming ~ '^PESARA-[A-Z0-9-]{4,40}$' then
    select user_id into referrer from public.referrals where code = incoming;
    if referrer is not null and referrer <> new.id then
      update public.profiles set referred_by = referrer where id = new.id;
      update public.referrals set invites = invites + 1 where user_id = referrer;
      insert into public.referral_events (code, kind, subject_user)
      values (incoming, 'registration', new.id);
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.note_referred_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
  referrer_code text;
begin
  if new.stage = 'submitted' and (tg_op = 'INSERT' or old.stage is distinct from 'submitted') then
    select referred_by into referrer from public.profiles where id = new.user_id;
    if referrer is not null and referrer is distinct from new.user_id then
      select code into referrer_code from public.referrals where user_id = referrer;
      if referrer_code is not null and not exists (
        select 1 from public.referral_events
        where application_id = new.id and kind = 'application'
      ) then
        insert into public.referral_events (code, kind, subject_user, application_id)
        values (referrer_code, 'application', new.user_id, new.id);
        update public.referrals
          set applications_referred = applications_referred + 1
          where user_id = referrer;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists referred_application on public.idea_applications;
create trigger referred_application
  after insert or update of stage on public.idea_applications
  for each row execute function private.note_referred_application();

create or replace function private.note_referred_venture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  founder uuid;
  referrer uuid;
  referrer_code text;
begin
  if new.application_id is null then
    return new;
  end if;
  select user_id into founder from public.idea_applications where id = new.application_id;
  select referred_by into referrer from public.profiles where id = founder;
  if referrer is null or referrer is not distinct from founder then
    return new;
  end if;
  select code into referrer_code from public.referrals where user_id = referrer;
  if referrer_code is null then
    return new;
  end if;
  if exists (
    select 1 from public.referral_events
    where venture_id = new.id and kind = 'accepted'
  ) then
    return new;
  end if;
  insert into public.referral_events (code, kind, subject_user, application_id, venture_id)
  values (referrer_code, 'accepted', founder, new.application_id, new.id);
  update public.referrals
    set accepted_referred = accepted_referred + 1
    where user_id = referrer;
  return new;
end;
$$;

drop trigger if exists referred_venture on public.ventures;
create trigger referred_venture
  after insert on public.ventures
  for each row execute function private.note_referred_venture();

create or replace function public.public_pipeline()
returns table (metric text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select published.metric, published.total
  from (
    select 'ideas_submitted'::text as metric, count(*)::bigint as total
    from public.idea_applications
    where stage <> 'draft'
    union all
    select 'under_review', count(*)::bigint
    from public.idea_applications
    where stage in ('submitted', 'screening', 'interview', 'committee')
    union all
    select 'in_validation', count(*)::bigint
    from public.idea_applications
    where stage = 'validation'
    union all
    select 'being_built', count(*)::bigint
    from public.idea_applications
    where stage in ('structuring', 'building')
    union all
    select 'launched', count(*)::bigint
    from public.ventures
    where status = 'LIVE' and is_demo = false
  ) published
  join public.system_settings settings on settings.key = 'public_metrics'
  where coalesce(settings.value ->> published.metric, 'false') = 'true';
$$;

revoke all on function public.public_pipeline() from public;
grant execute on function public.public_pipeline() to anon, authenticated;

create or replace function public.set_public_metrics(p_flags jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'not staff';
  end if;
  next_value := jsonb_build_object(
    'ideas_submitted', coalesce(p_flags ->> 'ideas_submitted', 'false') = 'true',
    'under_review', coalesce(p_flags ->> 'under_review', 'false') = 'true',
    'in_validation', coalesce(p_flags ->> 'in_validation', 'false') = 'true',
    'being_built', coalesce(p_flags ->> 'being_built', 'false') = 'true',
    'launched', coalesce(p_flags ->> 'launched', 'false') = 'true'
  );
  insert into public.system_settings (key, value, is_public)
  values ('public_metrics', next_value, true)
  on conflict (key) do update
    set value = excluded.value, updated_at = now();
end;
$$;

revoke all on function public.set_public_metrics(jsonb) from public;
revoke all on function public.set_public_metrics(jsonb) from anon;
grant execute on function public.set_public_metrics(jsonb) to authenticated;
