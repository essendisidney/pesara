-- founder_venture_view now returns the venture id so the founder dashboard can link to
-- the venture's Pesara Rails page. Same access rule as before; only the payload grows.

create or replace function public.founder_venture_view(p_application uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  venture uuid;
  payload jsonb;
begin
  if auth.uid() is null or p_application is null then
    return null;
  end if;
  if not exists (
    select 1 from public.idea_applications
    where id = p_application
      and user_id = auth.uid()
  ) then
    return null;
  end if;

  select id into venture
  from public.ventures
  where application_id = p_application
  order by created_at desc
  limit 1;

  if venture is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', v.id,
    'name', v.name,
    'description', v.description,
    'stage', v.stage,
    'status', v.status,
    'relationship', v.pesara_relationship,
    'website', v.website,
    'milestones', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'title', m.title,
          'due_on', m.due_on,
          'completed_at', m.completed_at
        )
        order by m.created_at
      )
      from public.venture_milestones m
      where m.venture_id = v.id
    ), '[]'::jsonb)
  )
  into payload
  from public.ventures v
  where v.id = venture;

  return payload;
end;
$$;

revoke all on function public.founder_venture_view(uuid) from public, anon;
grant execute on function public.founder_venture_view(uuid) to authenticated;
