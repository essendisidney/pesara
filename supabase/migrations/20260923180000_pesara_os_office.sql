-- Founder meetings and notes stay internal. Articles publish only when staff save them.
-- Analytics read existing stage history. Nothing here seeds founders, meetings, or articles.

create table if not exists public.founder_meetings (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.idea_applications (id) on delete set null,
  held_on date not null,
  summary text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.founder_meetings enable row level security;

drop policy if exists founder_meetings_staff on public.founder_meetings;
create policy founder_meetings_staff on public.founder_meetings
  for select using (private.is_staff());

grant select on public.founder_meetings to authenticated;

drop policy if exists articles_staff on public.articles;
create policy articles_staff on public.articles
  for select using (private.is_staff());

create or replace function public.add_founder_note(p_founder uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  note_body text := btrim(coalesce(p_body, ''));
  note_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if note_body = '' or char_length(note_body) > 4000 then
    raise exception 'invalid note';
  end if;
  if not exists (select 1 from public.profiles where id = p_founder) then
    raise exception 'founder not found';
  end if;

  insert into public.admin_notes (entity, entity_id, body, created_by)
  values ('founder', p_founder, note_body, auth.uid())
  returning id into note_id;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'FOUNDER_NOTE',
    'profile',
    p_founder,
    jsonb_build_object('note_id', note_id)
  );

  return note_id;
end;
$$;

revoke all on function public.add_founder_note(uuid, text) from public, anon;
grant execute on function public.add_founder_note(uuid, text) to authenticated;

create or replace function public.add_founder_meeting(
  p_founder uuid,
  p_application uuid,
  p_held date,
  p_summary text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  meeting uuid;
  meeting_summary text := btrim(coalesce(p_summary, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if p_held is null or meeting_summary = '' or char_length(meeting_summary) > 4000 then
    raise exception 'invalid meeting';
  end if;
  if not exists (select 1 from public.profiles where id = p_founder) then
    raise exception 'founder not found';
  end if;
  if p_application is not null and not exists (
    select 1 from public.idea_applications
    where id = p_application
      and user_id = p_founder
  ) then
    raise exception 'application not found';
  end if;

  insert into public.founder_meetings (founder_id, application_id, held_on, summary, created_by)
  values (p_founder, p_application, p_held, meeting_summary, auth.uid())
  returning id into meeting;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'MEETING_RECORDED',
    'profile',
    p_founder,
    jsonb_build_object('meeting_id', meeting)
  );

  return meeting;
end;
$$;

revoke all on function public.add_founder_meeting(uuid, uuid, date, text) from public, anon;
grant execute on function public.add_founder_meeting(uuid, uuid, date, text) to authenticated;

create or replace function public.save_article(
  p_slug text,
  p_title text,
  p_excerpt text,
  p_body text,
  p_category text,
  p_published boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  article uuid;
  article_slug text := btrim(coalesce(p_slug, ''));
  article_title text := btrim(coalesce(p_title, ''));
  article_excerpt text := nullif(btrim(coalesce(p_excerpt, '')), '');
  article_body text := btrim(coalesce(p_body, ''));
  article_category text := nullif(btrim(coalesce(p_category, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not private.is_staff() then
    raise exception 'not staff';
  end if;
  if article_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(article_slug) < 3 or char_length(article_slug) > 80 then
    raise exception 'invalid article';
  end if;
  if article_title = '' or char_length(article_title) > 160 or article_body = '' or char_length(article_body) > 20000 then
    raise exception 'invalid article';
  end if;
  if article_excerpt is not null and char_length(article_excerpt) > 300 then
    raise exception 'invalid article';
  end if;
  if article_category is not null and not exists (
    select 1 from public.article_categories where slug = article_category
  ) then
    raise exception 'invalid article';
  end if;

  insert into public.articles (slug, title, excerpt, body, category, published, author_id)
  values (article_slug, article_title, article_excerpt, article_body, article_category, coalesce(p_published, false), auth.uid())
  on conflict (slug) do update
    set title = excluded.title,
        excerpt = excluded.excerpt,
        body = excluded.body,
        category = excluded.category,
        published = excluded.published,
        updated_at = now()
  returning id into article;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    'ARTICLE_SAVED',
    'article',
    article,
    jsonb_build_object('article_id', article, 'published', coalesce(p_published, false))
  );

  return article;
end;
$$;

revoke all on function public.save_article(text, text, text, text, text, boolean) from public, anon;
grant execute on function public.save_article(text, text, text, text, text, boolean) to authenticated;
