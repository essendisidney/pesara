-- Staff store venture files in a private bucket. Founders do not read them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venture-documents',
  'venture-documents',
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

drop policy if exists venture_documents_read on storage.objects;
create policy venture_documents_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'venture-documents'
    and private.is_staff()
    and exists (
      select 1 from public.ventures
      where ventures.id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists venture_documents_insert on storage.objects;
create policy venture_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'venture-documents'
    and private.is_staff()
    and exists (
      select 1 from public.ventures
      where ventures.id::text = (storage.foldername(name))[1]
    )
  );

create or replace function public.register_venture_document(p_venture uuid, p_path text, p_title text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  document uuid;
  clean_title text := nullif(btrim(coalesce(p_title, '')), '');
  app uuid;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not authorised';
  end if;
  if p_venture is null or clean_title is null or char_length(clean_title) > 160 then
    raise exception 'invalid document';
  end if;
  if p_path is null or p_path <> btrim(p_path) or p_path !~ ('^' || lower(p_venture::text) || '/[0-9a-f-]{36}-') then
    raise exception 'invalid document';
  end if;

  select application_id into app from public.ventures where id = p_venture;
  if not found then
    raise exception 'venture not found';
  end if;

  insert into public.venture_documents (venture_id, path, title, created_by)
  values (p_venture, p_path, clean_title, auth.uid())
  returning id into document;

  if app is not null then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'VENTURE_DOCUMENT',
      'idea_application',
      app,
      jsonb_build_object('document_id', document)
    );
  end if;

  return document;
end;
$$;

revoke all on function public.register_venture_document(uuid, text, text) from public, anon;
grant execute on function public.register_venture_document(uuid, text, text) to authenticated;

revoke insert, update, delete on table public.venture_documents from public, anon, authenticated;
grant select on table public.venture_documents to authenticated;
