-- Staff can ask a founder for a document. The notice is a fixed sentence. The note stays off the activity line.

create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  kind text not null check (kind in (
    'PITCH_DECK','RESEARCH','FINANCIAL_MODEL','PROTOTYPE','LOI','CONTRACT','MARKET_RESEARCH','COMPANY','OTHER'
  )),
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint document_requests_note_len check (note is null or char_length(note) <= 160)
);

create index document_requests_application_idx on public.document_requests (application_id, created_at desc);

alter table public.document_requests enable row level security;

create policy document_requests_owner on public.document_requests
  for select using (
    exists (
      select 1 from public.idea_applications
      where idea_applications.id = application_id
        and idea_applications.user_id = auth.uid()
    )
  );

create policy document_requests_staff on public.document_requests
  for select using (private.is_staff());

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
    'document_requested',
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

create or replace function public.request_application_document(p_application uuid, p_kind text, p_note text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  asked text;
  request uuid;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not staff';
  end if;
  if p_application is null then
    raise exception 'application not found';
  end if;
  if p_kind not in (
    'PITCH_DECK','RESEARCH','FINANCIAL_MODEL','PROTOTYPE','LOI','CONTRACT','MARKET_RESEARCH','COMPANY','OTHER'
  ) then
    raise exception 'invalid request';
  end if;

  asked := nullif(btrim(coalesce(p_note, '')), '');
  if asked is not null and char_length(asked) > 160 then
    raise exception 'invalid request';
  end if;

  select user_id into owner
  from public.idea_applications
  where id = p_application;
  if not found then
    raise exception 'application not found';
  end if;

  insert into public.document_requests (application_id, kind, note, created_by)
  values (p_application, p_kind, asked, auth.uid())
  returning id into request;

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = p_application;

  perform private.notify_founder(owner, 'document_requested', 'Pesara asked for a document.');

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'DOCUMENT_REQUESTED',
    'idea_application',
    p_application,
    jsonb_build_object('request_id', request, 'kind', p_kind)
  );

  return request;
end;
$$;

revoke all on function private.notify_founder(uuid, text, text) from public, anon, authenticated;
revoke all on function public.request_application_document(uuid, text, text) from public, anon;
grant execute on function public.request_application_document(uuid, text, text) to authenticated;
revoke insert, update, delete on table public.document_requests from public, anon, authenticated;
grant select on table public.document_requests to authenticated;
