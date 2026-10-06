-- Replace the SECURITY DEFINER view public.portfolio_ventures with a function.
--
-- The view existed so visitors could read the public columns of published
-- ventures without a public row policy on public.ventures (which would expose
-- commercial terms). Supabase flags definer views as an error because their
-- privileges are easy to widen by accident. A function with a fixed column list
-- keeps the same guarantee and makes the boundary explicit.

create or replace function public.published_portfolio()
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  industry text,
  country text,
  stage text,
  website text,
  status text,
  pesara_relationship text
)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.name, v.slug, v.description, v.industry, v.country,
         v.stage, v.website, v.status, v.pesara_relationship
  from public.ventures v
  where v.public_visible = true
    and v.is_demo = false
  order by v.created_at desc
  limit 50;
$$;

revoke all on function public.published_portfolio() from public, anon, authenticated;
grant execute on function public.published_portfolio() to anon, authenticated;

drop view if exists public.portfolio_ventures;
