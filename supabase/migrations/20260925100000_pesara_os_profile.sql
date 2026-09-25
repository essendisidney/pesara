-- A founder updates their own contact details. Marketing consent stays on its own function.

create or replace function public.update_founder_profile(
  p_name text,
  p_phone text,
  p_country text,
  p_city text,
  p_occupation text,
  p_linkedin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := nullif(btrim(coalesce(p_name, '')), '');
  clean_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  clean_country text := nullif(btrim(coalesce(p_country, '')), '');
  clean_city text := nullif(btrim(coalesce(p_city, '')), '');
  clean_occupation text := nullif(btrim(coalesce(p_occupation, '')), '');
  clean_linkedin text := nullif(btrim(coalesce(p_linkedin, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if char_length(coalesce(clean_name, '')) > 120
    or char_length(coalesce(clean_phone, '')) > 40
    or char_length(coalesce(clean_country, '')) > 80
    or char_length(coalesce(clean_city, '')) > 80
    or char_length(coalesce(clean_occupation, '')) > 120
    or char_length(coalesce(clean_linkedin, '')) > 300
    or (clean_linkedin is not null and clean_linkedin !~* '^https?://')
  then
    raise exception 'invalid profile';
  end if;

  update public.profiles
  set full_name = clean_name,
      phone = clean_phone,
      country = clean_country,
      city = clean_city,
      occupation = clean_occupation,
      linkedin_url = clean_linkedin,
      updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

revoke all on function public.update_founder_profile(text, text, text, text, text, text) from public, anon;
grant execute on function public.update_founder_profile(text, text, text, text, text, text) to authenticated;
