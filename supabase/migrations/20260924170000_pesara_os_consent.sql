-- Marketing consent is a recorded choice. The box starts unticked. A founder cannot write the row directly.

drop policy if exists consent_self on public.consent_events;

alter table public.consent_events
  drop constraint if exists consent_events_kind_check;

alter table public.consent_events
  add constraint consent_events_kind_check check (kind in ('marketing'));

create policy consent_events_owner on public.consent_events
  for select using (user_id = auth.uid());

create policy consent_events_staff on public.consent_events
  for select using (private.is_staff());

create or replace function public.set_marketing_consent(p_granted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_choice boolean;
  choice text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_granted is null then
    raise exception 'invalid consent';
  end if;

  select marketing_opt_in into current_choice
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'profile not found';
  end if;

  if current_choice is not distinct from p_granted then
    return;
  end if;

  update public.profiles
  set marketing_opt_in = p_granted,
      updated_at = now()
  where id = auth.uid();

  insert into public.consent_events (user_id, kind, granted)
  values (auth.uid(), 'marketing', p_granted);

  choice := case when p_granted then 'granted' else 'withdrawn' end;
  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'CONSENT_RECORDED',
    'profile',
    auth.uid(),
    jsonb_build_object('kind', 'marketing', 'choice', choice)
  );
end;
$$;

revoke all on function public.set_marketing_consent(boolean) from public, anon;
grant execute on function public.set_marketing_consent(boolean) to authenticated;

revoke insert, update, delete on table public.consent_events from public, anon, authenticated;
grant select on table public.consent_events to authenticated;

revoke update on table public.profiles from public, anon, authenticated;
grant update (
  full_name,
  phone,
  country,
  city,
  linkedin_url,
  occupation,
  updated_at
) on table public.profiles to authenticated;
