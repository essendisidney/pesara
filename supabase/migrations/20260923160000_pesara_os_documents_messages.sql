-- Founder documents stay in a private bucket. Messages are threads on an application.
-- A founder can read and write only their own application.

alter table public.application_documents
  add column if not exists kind text,
  add column if not exists title text;

alter table public.application_documents
  drop constraint if exists application_documents_kind_check;

alter table public.application_documents
  add constraint application_documents_kind_check
  check (
    kind is null
    or kind in (
      'PITCH_DECK','RESEARCH','FINANCIAL_MODEL','PROTOTYPE','LOI',
      'CONTRACT','MARKET_RESEARCH','COMPANY','OTHER'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists application_documents_read on storage.objects;
create policy application_documents_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'application-documents'
    and exists (
      select 1 from public.idea_applications app
      where app.id::text = (storage.foldername(name))[1]
        and (app.user_id = auth.uid() or private.is_staff())
    )
  );

drop policy if exists application_documents_insert on storage.objects;
create policy application_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'application-documents'
    and exists (
      select 1 from public.idea_applications app
      where app.id::text = (storage.foldername(name))[1]
        and (app.user_id = auth.uid() or private.is_staff())
    )
  );

drop policy if exists documents_owner on public.application_documents;
create policy documents_owner on public.application_documents
  for select using (
    exists (
      select 1 from public.idea_applications app
      where app.id = application_id
        and app.user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

drop policy if exists documents_insert_owner on public.application_documents;
create policy documents_insert_owner on public.application_documents
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.idea_applications app
      where app.id = application_id
        and (app.user_id = auth.uid() or private.is_staff())
    )
  );

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.idea_applications (id) on delete cascade,
  subject text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists thread_id uuid references public.message_threads (id) on delete cascade,
  add column if not exists read_at timestamptz,
  add column if not exists document_id uuid references public.application_documents (id);

alter table public.message_threads enable row level security;

drop policy if exists threads_read on public.message_threads;
create policy threads_read on public.message_threads
  for select using (
    private.is_staff()
    or exists (
      select 1 from public.idea_applications app
      where app.id = application_id
        and app.user_id = auth.uid()
    )
  );

drop policy if exists messages_insert on public.messages;

create or replace function public.register_application_document(
  p_application uuid,
  p_path text,
  p_kind text,
  p_title text,
  p_mime text,
  p_bytes int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  doc uuid;
  clean_path text := btrim(coalesce(p_path, ''));
  clean_title text := nullif(btrim(coalesce(p_title, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in (
    'PITCH_DECK','RESEARCH','FINANCIAL_MODEL','PROTOTYPE','LOI',
    'CONTRACT','MARKET_RESEARCH','COMPANY','OTHER'
  ) then
    raise exception 'invalid document';
  end if;
  if p_bytes is null or p_bytes < 1 or p_bytes > 20971520 then
    raise exception 'invalid document';
  end if;
  if p_mime not in (
    'application/pdf','image/png','image/jpeg','image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.document'
  ) then
    raise exception 'invalid document';
  end if;
  if clean_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,160}$' then
    raise exception 'invalid document';
  end if;
  if split_part(clean_path, '/', 1) <> p_application::text then
    raise exception 'invalid document';
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = p_application
      and (user_id = auth.uid() or private.is_staff())
  ) then
    raise exception 'application not found';
  end if;

  insert into public.application_documents (application_id, user_id, path, mime_type, byte_size, kind, title)
  values (p_application, auth.uid(), clean_path, p_mime, p_bytes, p_kind, clean_title)
  returning id into doc;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'DOCUMENT_UPLOADED',
    'idea_application',
    p_application,
    jsonb_build_object('document_id', doc)
  );

  return doc;
end;
$$;

revoke all on function public.register_application_document(uuid, text, text, text, text, int) from public;
revoke all on function public.register_application_document(uuid, text, text, text, text, int) from anon;
grant execute on function public.register_application_document(uuid, text, text, text, text, int) to authenticated;

create or replace function public.open_message_thread(p_application uuid, p_subject text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  thread uuid;
  clean_subject text := btrim(coalesce(p_subject, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if clean_subject = '' or char_length(clean_subject) > 120 then
    raise exception 'invalid message';
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = p_application
      and (user_id = auth.uid() or private.is_staff())
  ) then
    raise exception 'application not found';
  end if;
  insert into public.message_threads (application_id, subject, created_by)
  values (p_application, clean_subject, auth.uid())
  returning id into thread;
  return thread;
end;
$$;

revoke all on function public.open_message_thread(uuid, text) from public;
revoke all on function public.open_message_thread(uuid, text) from anon;
grant execute on function public.open_message_thread(uuid, text) to authenticated;

create or replace function public.post_message(p_thread uuid, p_body text, p_document uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  app uuid;
  message uuid;
  clean_body text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if clean_body = '' or char_length(clean_body) > 4000 then
    raise exception 'invalid message';
  end if;
  select application_id into app from public.message_threads where id = p_thread;
  if app is null then
    raise exception 'application not found';
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = app
      and (user_id = auth.uid() or private.is_staff())
  ) then
    raise exception 'application not found';
  end if;
  if p_document is not null and not exists (
    select 1 from public.application_documents
    where id = p_document
      and application_id = app
  ) then
    raise exception 'invalid document';
  end if;

  insert into public.messages (application_id, thread_id, sender, body, document_id)
  values (app, p_thread, auth.uid(), clean_body, p_document)
  returning id into message;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'MESSAGE_SENT',
    'idea_application',
    app,
    jsonb_build_object('message_id', message)
  );

  return message;
end;
$$;

revoke all on function public.post_message(uuid, text, uuid) from public;
revoke all on function public.post_message(uuid, text, uuid) from anon;
grant execute on function public.post_message(uuid, text, uuid) to authenticated;

create or replace function public.mark_thread_read(p_thread uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select application_id into app from public.message_threads where id = p_thread;
  if app is null then
    raise exception 'application not found';
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = app
      and (user_id = auth.uid() or private.is_staff())
  ) then
    raise exception 'application not found';
  end if;
  update public.messages
    set read_at = now()
    where thread_id = p_thread
      and sender is distinct from auth.uid()
      and read_at is null;
end;
$$;

revoke all on function public.mark_thread_read(uuid) from public;
revoke all on function public.mark_thread_read(uuid) from anon;
grant execute on function public.mark_thread_read(uuid) to authenticated;

grant select on public.message_threads to authenticated;

create index if not exists message_threads_application_idx on public.message_threads (application_id, created_at);
create index if not exists messages_thread_idx on public.messages (thread_id);
