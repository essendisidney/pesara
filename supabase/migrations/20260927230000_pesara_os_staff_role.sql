-- An admin can name a Pesara role. A person cannot change their own role.
-- Admin rights can be granted only by a super admin. The address stays off the activity line.

create or replace function public.set_staff_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
  current_role text;
begin
  if auth.uid() is null or p_user is null or p_user = auth.uid() then
    raise exception 'invalid role';
  end if;
  if p_role not in (
    'FOUNDER','ANALYST','PRODUCT','ENGINEER','INVESTMENT_COMMITTEE','ADMIN','SUPER_ADMIN'
  ) then
    raise exception 'invalid role';
  end if;

  select role into actor from public.user_roles where user_id = auth.uid();
  if actor is null or actor not in ('ADMIN', 'SUPER_ADMIN') then
    raise exception 'not authorised';
  end if;

  select role into current_role
  from public.user_roles
  where user_id = p_user
  for update;

  if not found then
    raise exception 'role not found';
  end if;
  if current_role is not distinct from p_role then
    return;
  end if;

  if actor = 'ADMIN' and (
    current_role in ('ADMIN', 'SUPER_ADMIN')
    or p_role in ('ADMIN', 'SUPER_ADMIN')
  ) then
    raise exception 'not authorised';
  end if;

  update public.user_roles
    set role = p_role
    where user_id = p_user;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ROLE_ASSIGNED',
    'profile',
    p_user,
    jsonb_build_object('role', p_role)
  );
end;
$$;

revoke all on function public.set_staff_role(uuid, text) from public, anon;
grant execute on function public.set_staff_role(uuid, text) to authenticated;

revoke update, delete on table public.user_roles from public, anon, authenticated;
