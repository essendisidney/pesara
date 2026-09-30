-- Named team members are added by the application owner. Staff can read them.

drop policy if exists team_owner on public.application_team_members;
drop policy if exists team_staff on public.application_team_members;

create policy team_owner on public.application_team_members
  for select using (
    exists (
      select 1 from public.idea_applications
      where idea_applications.id = application_id
        and idea_applications.user_id = auth.uid()
    )
  );

create policy team_staff on public.application_team_members
  for select using (private.is_staff());

create or replace function public.add_team_member(p_application uuid, p_name text, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  member uuid;
  clean_name text := nullif(btrim(coalesce(p_name, '')), '');
  clean_role text := nullif(btrim(coalesce(p_role, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_application is null or clean_name is null
    or char_length(clean_name) > 120
    or char_length(coalesce(clean_role, '')) > 80
  then
    raise exception 'invalid team member';
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = p_application and user_id = auth.uid()
  ) then
    raise exception 'application not found';
  end if;

  insert into public.application_team_members (application_id, full_name, role)
  values (p_application, clean_name, clean_role)
  returning id into member;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'TEAM_MEMBER_ADDED',
    'idea_application',
    p_application,
    jsonb_build_object('member_id', member)
  );

  return member;
end;
$$;

create or replace function public.remove_team_member(p_member uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app uuid;
begin
  if auth.uid() is null or p_member is null then
    raise exception 'not authenticated';
  end if;

  select application_id into app
  from public.application_team_members
  where id = p_member
    and exists (
      select 1 from public.idea_applications
      where idea_applications.id = application_team_members.application_id
        and idea_applications.user_id = auth.uid()
    );

  if app is null then
    raise exception 'team member not found';
  end if;

  delete from public.application_team_members where id = p_member;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'TEAM_MEMBER_REMOVED',
    'idea_application',
    app,
    jsonb_build_object('member_id', p_member)
  );
end;
$$;

revoke all on function public.add_team_member(uuid, text, text) from public, anon;
revoke all on function public.remove_team_member(uuid) from public, anon;
grant execute on function public.add_team_member(uuid, text, text) to authenticated;
grant execute on function public.remove_team_member(uuid) to authenticated;

revoke insert, update, delete on table public.application_team_members from public, anon, authenticated;
grant select on table public.application_team_members to authenticated;
