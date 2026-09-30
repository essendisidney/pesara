-- An admin can place a venture on the public portfolio. Commercial terms stay off the card and off the activity line.

create or replace function public.set_venture_publication(p_id uuid, p_public boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app uuid;
  visible boolean;
  relationship text;
  site text;
  about text;
  demo boolean;
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'not authorised';
  end if;
  if p_id is null or p_public is null then
    raise exception 'invalid venture';
  end if;

  select application_id, public_visible, pesara_relationship, website, description, is_demo
    into app, visible, relationship, site, about, demo
  from public.ventures
  where id = p_id
  for update;

  if not found then
    raise exception 'venture not found';
  end if;
  if visible is not distinct from p_public then
    return;
  end if;

  if p_public then
    if demo
      or relationship not in ('built_by_pesara', 'pesara_company', 'technology_by_pesara')
      or site is null
      or site !~ '^https?://'
      or about is null
      or char_length(btrim(about)) < 1
      or char_length(btrim(about)) > 600
    then
      raise exception 'invalid venture';
    end if;
  end if;

  update public.ventures
    set public_visible = p_public, updated_at = now()
    where id = p_id;

  insert into public.activity_logs (actor, action, entity, entity_id, metadata)
  values (
    auth.uid(),
    case when p_public then 'VENTURE_PUBLISHED' else 'VENTURE_UNPUBLISHED' end,
    case when app is null then 'venture' else 'idea_application' end,
    coalesce(app, p_id),
    jsonb_build_object('venture_id', p_id)
  );
end;
$$;

revoke all on function public.set_venture_publication(uuid, boolean) from public, anon;
grant execute on function public.set_venture_publication(uuid, boolean) to authenticated;
