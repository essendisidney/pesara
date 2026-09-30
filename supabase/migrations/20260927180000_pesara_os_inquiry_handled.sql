-- Staff mark a contact message handled. The address and the message stay off the activity line.

alter table public.inquiries
  add column if not exists status text not null default 'open';

alter table public.inquiries
  drop constraint if exists inquiries_status_check;

alter table public.inquiries
  add constraint inquiries_status_check check (status in ('open', 'handled'));

create or replace function public.mark_inquiry_handled(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not authorised';
  end if;
  if p_id is null then
    raise exception 'inquiry not found';
  end if;

  update public.inquiries
    set status = 'handled'
    where id = p_id
      and status = 'open';

  if not found then
    raise exception 'inquiry not found';
  end if;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'INQUIRY_HANDLED',
    'inquiry',
    p_id,
    jsonb_build_object('inquiry_id', p_id)
  );
end;
$$;

revoke all on function public.mark_inquiry_handled(uuid) from public, anon;
grant execute on function public.mark_inquiry_handled(uuid) to authenticated;

revoke update, delete on table public.inquiries from public, anon, authenticated;
