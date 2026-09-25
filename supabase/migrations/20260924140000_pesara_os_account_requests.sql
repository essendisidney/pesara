-- Account export and deletion are requests. A person records them. Nothing is deleted here.

drop policy if exists data_requests_self on public.data_requests;

alter table public.data_requests
  drop constraint if exists data_requests_status_check;

alter table public.data_requests
  add constraint data_requests_status_check check (status in ('requested', 'recorded'));

create policy data_requests_owner on public.data_requests
  for select using (user_id = auth.uid());

create policy data_requests_staff on public.data_requests
  for select using (private.is_staff());

create or replace function public.request_account_action(p_kind text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request uuid;
  clean_kind text := btrim(coalesce(p_kind, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if clean_kind not in ('export', 'deletion') then
    raise exception 'invalid request';
  end if;

  select id into request
  from public.data_requests
  where user_id = auth.uid()
    and kind = clean_kind
    and status = 'requested'
  limit 1;

  if request is not null then
    return request;
  end if;

  insert into public.data_requests (user_id, kind, status)
  values (auth.uid(), clean_kind, 'requested')
  returning id into request;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ACCOUNT_REQUESTED',
    'data_request',
    request,
    jsonb_build_object('request_id', request, 'kind', clean_kind)
  );

  return request;
end;
$$;

create or replace function public.record_account_request(p_request uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not authorised';
  end if;
  if p_request is null then
    raise exception 'request not found';
  end if;

  update public.data_requests
    set status = 'recorded'
    where id = p_request
      and status = 'requested';

  if not found then
    raise exception 'request not found';
  end if;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ACCOUNT_REQUEST_RECORDED',
    'data_request',
    p_request,
    jsonb_build_object('request_id', p_request)
  );
end;
$$;

revoke all on function public.request_account_action(text) from public, anon;
revoke all on function public.record_account_request(uuid) from public, anon;
grant execute on function public.request_account_action(text) to authenticated;
grant execute on function public.record_account_request(uuid) to authenticated;

revoke insert, update, delete on table public.data_requests from public, anon, authenticated;
grant select on table public.data_requests to authenticated;
