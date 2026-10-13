-- Operational issue log. Server code records failures it would otherwise only
-- print to Vercel's function logs (email that did not send, Rails intake that
-- could not be stored), so staff can see them in /admin/system.
-- Written only with the service role; staff can read; nobody else can see it.

create table if not exists public.ops_events (
  id bigint generated always as identity primary key,
  source text not null check (char_length(source) between 1 and 64),
  level text not null default 'error' check (level in ('warn', 'error')),
  message text not null check (char_length(message) between 1 and 500),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_events_created_at on public.ops_events (created_at desc);

alter table public.ops_events enable row level security;
revoke all on table public.ops_events from public, anon, authenticated;
grant select on table public.ops_events to authenticated;

drop policy if exists ops_events_staff_read on public.ops_events;
create policy ops_events_staff_read on public.ops_events
  for select to authenticated
  using (private.is_staff());
