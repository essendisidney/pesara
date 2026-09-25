-- Community addresses are stored only through join_waitlist. Leaving does not say whether the address was present.

drop policy if exists waitlist_insert on public.waitlist;

create or replace function public.join_waitlist(
  p_name text,
  p_email text,
  p_country text,
  p_interests text,
  p_persona text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  entry uuid;
  clean_name text := nullif(btrim(coalesce(p_name, '')), '');
  clean_email text := btrim(coalesce(p_email, ''));
  clean_country text := nullif(btrim(coalesce(p_country, '')), '');
  clean_interests text := nullif(btrim(coalesce(p_interests, '')), '');
  clean_persona text := btrim(coalesce(p_persona, ''));
begin
  if clean_name is not null and char_length(clean_name) > 80 then
    raise exception 'invalid waitlist';
  end if;
  if clean_country is not null and char_length(clean_country) > 80 then
    raise exception 'invalid waitlist';
  end if;
  if clean_interests is not null and char_length(clean_interests) > 160 then
    raise exception 'invalid waitlist';
  end if;
  if clean_email = ''
    or char_length(clean_email) > 160
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid waitlist';
  end if;
  if clean_persona not in ('Founder', 'Investor', 'Technologist', 'Business', 'Student', 'Other') then
    raise exception 'invalid waitlist';
  end if;

  select id into entry
  from public.waitlist
  where lower(email) = lower(clean_email)
  order by created_at desc
  limit 1;

  if entry is not null then
    update public.waitlist
      set name = clean_name,
          country = clean_country,
          interests = clean_interests,
          persona = clean_persona,
          consent_at = now(),
          unsubscribed_at = null
      where id = entry;
    return entry;
  end if;

  insert into public.waitlist (name, email, country, interests, persona, consent_at)
  values (clean_name, clean_email, clean_country, clean_interests, clean_persona, now())
  returning id into entry;

  return entry;
end;
$$;

create or replace function public.leave_waitlist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := btrim(coalesce(p_email, ''));
begin
  if clean_email = ''
    or char_length(clean_email) > 160
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid waitlist';
  end if;

  update public.waitlist
    set unsubscribed_at = now()
    where lower(email) = lower(clean_email)
      and unsubscribed_at is null;
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.leave_waitlist(text) from public, anon, authenticated;
grant execute on function public.join_waitlist(text, text, text, text, text) to anon, authenticated;
grant execute on function public.leave_waitlist(text) to anon, authenticated;

revoke insert, update, delete on table public.waitlist from public, anon, authenticated;
