-- Contact messages are stored only through submit_inquiry.

drop policy if exists inquiries_insert on public.inquiries;

create or replace function public.submit_inquiry(
  p_name text,
  p_email text,
  p_type text,
  p_message text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inquiry uuid;
  clean_name text := nullif(btrim(coalesce(p_name, '')), '');
  clean_email text := btrim(coalesce(p_email, ''));
  clean_type text := btrim(coalesce(p_type, ''));
  clean_message text := btrim(coalesce(p_message, ''));
begin
  if clean_name is not null and char_length(clean_name) > 80 then
    raise exception 'invalid inquiry';
  end if;
  if clean_email = ''
    or char_length(clean_email) > 160
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid inquiry';
  end if;
  if clean_type not in (
    'Build software',
    'Submit idea',
    'Corporate partnership',
    'Investor',
    'University',
    'Media',
    'Other'
  ) then
    raise exception 'invalid inquiry';
  end if;
  if clean_message = '' or char_length(clean_message) > 4000 then
    raise exception 'invalid inquiry';
  end if;

  insert into public.inquiries (name, email, inquiry_type, message)
  values (clean_name, clean_email, clean_type, clean_message)
  returning id into inquiry;

  return inquiry;
end;
$$;

revoke all on function public.submit_inquiry(text, text, text, text) from public;
revoke all on function public.submit_inquiry(text, text, text, text) from anon;
revoke all on function public.submit_inquiry(text, text, text, text) from authenticated;
grant execute on function public.submit_inquiry(text, text, text, text) to anon, authenticated;

revoke insert on table public.inquiries from public;
revoke insert on table public.inquiries from anon;
revoke insert on table public.inquiries from authenticated;
