-- Founder notices are written by triggers. A founder can read and mark their own. They cannot insert one.

drop policy if exists notifications_self on public.notifications;

create policy notifications_owner on public.notifications
  for select using (user_id = auth.uid());

create or replace function private.notify_founder(p_user uuid, p_kind text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  if p_kind not in (
    'application_received',
    'stage_changed',
    'interview_requested',
    'validation_started',
    'committee_decision',
    'venture_accepted',
    'new_message'
  ) then
    return;
  end if;
  if btrim(coalesce(p_body, '')) = '' or char_length(p_body) > 160 then
    return;
  end if;

  insert into public.notifications (user_id, kind, body)
  values (p_user, p_kind, btrim(p_body));
end;
$$;

create or replace function private.notify_application_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text;
  body text;
begin
  if new.stage is not distinct from old.stage then
    return new;
  end if;

  if new.stage = 'submitted' and old.stage = 'draft' then
    kind := 'application_received';
    body := 'Pesara has your idea.';
  elsif new.stage = 'interview' then
    kind := 'interview_requested';
    body := 'Pesara asked for a founder interview.';
  elsif new.stage = 'validation' then
    kind := 'validation_started';
    body := 'Your idea is in validation.';
  else
    kind := 'stage_changed';
    body := 'The stage of your idea changed.';
  end if;

  perform private.notify_founder(new.user_id, kind, body);
  return new;
end;
$$;

create or replace function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select user_id into owner
  from public.idea_applications
  where id = new.application_id;

  if owner is not null and owner is distinct from new.sender then
    perform private.notify_founder(owner, 'new_message', 'A new message is on your idea.');
  end if;
  return new;
end;
$$;

create or replace function private.notify_committee_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select user_id into owner
  from public.idea_applications
  where id = new.application_id;

  perform private.notify_founder(owner, 'committee_decision', 'A decision is ready on your idea.');
  return new;
end;
$$;

create or replace function private.notify_venture_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  if new.application_id is null then
    return new;
  end if;

  select user_id into owner
  from public.idea_applications
  where id = new.application_id;

  perform private.notify_founder(owner, 'venture_accepted', 'Your idea has a venture record.');
  return new;
end;
$$;

drop trigger if exists idea_applications_notify on public.idea_applications;
create trigger idea_applications_notify
  after update of stage on public.idea_applications
  for each row execute function private.notify_application_stage();

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function private.notify_new_message();

drop trigger if exists committee_decisions_notify on public.committee_decisions;
create trigger committee_decisions_notify
  after insert on public.committee_decisions
  for each row execute function private.notify_committee_decision();

drop trigger if exists ventures_notify on public.ventures;
create trigger ventures_notify
  after insert on public.ventures
  for each row execute function private.notify_venture_created();

create or replace function public.mark_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_id is null then
    raise exception 'not found';
  end if;

  update public.notifications
    set read_at = now()
    where id = p_id
      and user_id = auth.uid()
      and read_at is null;

  if not found then
    raise exception 'not found';
  end if;
end;
$$;

revoke all on function private.notify_founder(uuid, text, text) from public, anon, authenticated;
revoke all on function private.notify_application_stage() from public, anon, authenticated;
revoke all on function private.notify_new_message() from public, anon, authenticated;
revoke all on function private.notify_committee_decision() from public, anon, authenticated;
revoke all on function private.notify_venture_created() from public, anon, authenticated;
revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

revoke insert, update, delete on table public.notifications from public, anon, authenticated;
grant select on table public.notifications to authenticated;
