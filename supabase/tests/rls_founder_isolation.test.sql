-- Live row-level security checks. Run with `supabase test db`.
--
-- Two founders (A, B), one analyst (staff) and the anonymous role. Everything
-- runs in one transaction and is rolled back, so no data is left behind.
--
-- Users are simulated the same way PostgREST does it: switch to the
-- `authenticated` (or `anon`) role and set `request.jwt.claims`, which is what
-- `auth.uid()` reads.

begin;

create extension if not exists pgtap with schema extensions;

select plan(41);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Act as a signed-in user.
create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text,
    true
  );
end;
$$;

-- Act as a visitor with no session.
create function pg_temp.act_as_anon() returns void
language plpgsql as $$
begin
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end;
$$;

-- Back to the test owner (bypasses RLS) for setup and verification.
create function pg_temp.act_as_owner() returns void
language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Rows the current role can read in a relation. A permission error counts as
-- zero rows: either way nothing is readable. (Policies call private.is_staff(),
-- which anon may not execute, so anon reads can fail rather than return empty.)
create function pg_temp.visible_rows(p_rel regclass) returns bigint
language plpgsql as $$
declare
  n bigint;
begin
  execute format('select count(*) from %s', p_rel) into n;
  return n;
exception
  when insufficient_privilege then
    return 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures (inserted as the owner; RLS does not apply)
-- ---------------------------------------------------------------------------

-- The on_auth_user_created trigger creates profiles, FOUNDER roles and referrals.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'founder-a@pesara.test', '{"full_name":"Founder A"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'founder-b@pesara.test', '{"full_name":"Founder B"}'),
  ('c0000000-0000-4000-8000-00000000000c', 'analyst@pesara.test',   '{"full_name":"Analyst"}');

update public.user_roles set role = 'ANALYST'
  where user_id = 'c0000000-0000-4000-8000-00000000000c';

insert into public.idea_applications (id, user_id, reference, stage) values
  ('a1000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-00000000000a', 'PSR-TEST-A', 'submitted'),
  ('b1000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-00000000000b', 'PSR-TEST-B', 'submitted');

insert into public.application_documents (application_id, user_id, path) values
  ('a1000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-00000000000a', 'a1000000-0000-4000-8000-0000000000a1/deck.pdf'),
  ('b1000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-00000000000b', 'b1000000-0000-4000-8000-0000000000b1/deck.pdf');

insert into public.message_threads (id, application_id, subject, created_by) values
  ('a2000000-0000-4000-8000-0000000000a2', 'a1000000-0000-4000-8000-0000000000a1', 'Thread A', 'c0000000-0000-4000-8000-00000000000c'),
  ('b2000000-0000-4000-8000-0000000000b2', 'b1000000-0000-4000-8000-0000000000b1', 'Thread B', 'c0000000-0000-4000-8000-00000000000c');

-- Messages from staff to each founder. The notify trigger also writes a notice
-- for each founder.
insert into public.messages (application_id, thread_id, sender, body) values
  ('a1000000-0000-4000-8000-0000000000a1', 'a2000000-0000-4000-8000-0000000000a2', 'c0000000-0000-4000-8000-00000000000c', 'Hello A'),
  ('b1000000-0000-4000-8000-0000000000b1', 'b2000000-0000-4000-8000-0000000000b2', 'c0000000-0000-4000-8000-00000000000c', 'Hello B');

insert into public.notifications (user_id, kind, body) values
  ('a0000000-0000-4000-8000-00000000000a', 'test', 'Notice for A'),
  ('b0000000-0000-4000-8000-00000000000b', 'test', 'Notice for B');

insert into public.committee_decisions (application_id, decision, committee_notes, founder_feedback, next_steps) values
  ('a1000000-0000-4000-8000-0000000000a1', 'PILOT', 'internal: A', 'Feedback for A', 'Run a pilot'),
  ('b1000000-0000-4000-8000-0000000000b1', 'PARK',  'internal: B', 'Feedback for B', 'Revisit later');

insert into public.ventures (id, name, application_id) values
  ('b3000000-0000-4000-8000-0000000000b3', 'Venture B', 'b1000000-0000-4000-8000-0000000000b1');
insert into public.venture_founders (venture_id, user_id, full_name) values
  ('b3000000-0000-4000-8000-0000000000b3', 'b0000000-0000-4000-8000-00000000000b', 'Founder B');

insert into public.waitlist (email) values ('waiting@pesara.test');
insert into public.inquiries (email, inquiry_type, message) values ('asker@pesara.test', 'general', 'Hello');

-- ---------------------------------------------------------------------------
-- Founder A
-- ---------------------------------------------------------------------------

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');

select is(
  (select array_agg(id) from public.idea_applications),
  array['a1000000-0000-4000-8000-0000000000a1'::uuid],
  'founder A sees only their own application'
);
select is(
  (select count(*) from public.idea_applications where user_id = 'b0000000-0000-4000-8000-00000000000b'),
  0::bigint,
  'founder A cannot select founder B''s application'
);

select is(
  (select count(*) from public.application_documents where application_id = 'a1000000-0000-4000-8000-0000000000a1'),
  1::bigint,
  'founder A sees their own document'
);
select is(
  (select count(*) from public.application_documents where application_id = 'b1000000-0000-4000-8000-0000000000b1'),
  0::bigint,
  'founder A cannot select founder B''s documents'
);

select is(
  (select array_agg(id) from public.profiles),
  array['a0000000-0000-4000-8000-00000000000a'::uuid],
  'founder A sees only their own profile'
);

select is(
  (select array_agg(body) from public.notifications where kind = 'test'),
  array['Notice for A'],
  'founder A sees only their own notices'
);
select is(
  (select count(*) from public.notifications where user_id = 'b0000000-0000-4000-8000-00000000000b'),
  0::bigint,
  'founder A cannot select founder B''s notices'
);

select is(
  (select array_agg(body) from public.messages),
  array['Hello A'],
  'founder A sees only messages on their own application'
);
select is(
  (select count(*) from public.message_threads where application_id = 'b1000000-0000-4000-8000-0000000000b1'),
  0::bigint,
  'founder A cannot select founder B''s message threads'
);

select is(
  (select count(*) from public.ventures),
  0::bigint,
  'founder A cannot select ventures they do not belong to'
);
select is(
  (select count(*) from public.venture_founders),
  0::bigint,
  'founder A cannot select another venture''s founders'
);
select is(
  public.founder_venture_view('b1000000-0000-4000-8000-0000000000b1'),
  null::jsonb,
  'founder_venture_view returns nothing for founder B''s application'
);

select is(
  (select count(*) from public.committee_decisions),
  0::bigint,
  'founder A cannot select committee_decisions (committee_notes stay internal)'
);
select is(
  (select founder_feedback from public.founder_decision_view('a1000000-0000-4000-8000-0000000000a1')),
  'Feedback for A',
  'founder A reads their own decision through founder_decision_view'
);
select is(
  (select count(*) from public.founder_decision_view('b1000000-0000-4000-8000-0000000000b1')),
  0::bigint,
  'founder_decision_view returns nothing for founder B''s application'
);
select ok(
  pg_get_function_result('public.founder_decision_view(uuid)'::regprocedure) !~ 'committee_notes|reason',
  'founder_decision_view does not expose committee_notes or the internal reason'
);

select is(pg_temp.visible_rows('public.waitlist'), 0::bigint, 'founder A cannot read the waitlist');
select is(pg_temp.visible_rows('public.inquiries'), 0::bigint, 'founder A cannot read inquiries');

-- Roles: a founder cannot make themselves staff.
select is(
  (select array_agg(role) from public.user_roles),
  array['FOUNDER'],
  'founder A sees only their own role'
);
select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('a0000000-0000-4000-8000-00000000000a', 'SUPER_ADMIN') $$,
  '42501',
  null,
  'founder A cannot insert a staff role for themselves'
);
select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('b0000000-0000-4000-8000-00000000000b', 'ADMIN') $$,
  '42501',
  null,
  'founder A cannot insert a role for someone else'
);
select throws_ok(
  $$ update public.user_roles set role = 'ADMIN' where user_id = 'a0000000-0000-4000-8000-00000000000a' $$,
  '42501',
  null,
  'founder A cannot update their own role'
);
select throws_ok(
  $$ select public.set_staff_role('a0000000-0000-4000-8000-00000000000a', 'ADMIN') $$,
  'P0001',
  'invalid role',
  'set_staff_role refuses a self-assignment'
);
select throws_ok(
  $$ select public.set_staff_role('b0000000-0000-4000-8000-00000000000b', 'ANALYST') $$,
  'P0001',
  'not authorised',
  'set_staff_role refuses a founder caller'
);

-- Writes against founder B's data.
select throws_ok(
  $$ insert into public.idea_applications (user_id, stage) values ('b0000000-0000-4000-8000-00000000000b', 'draft') $$,
  '42501',
  null,
  'founder A cannot create an application owned by founder B'
);
update public.idea_applications set payload = '{"hijacked":true}'
  where id = 'b1000000-0000-4000-8000-0000000000b1';
update public.profiles set full_name = 'Hijacked'
  where id = 'b0000000-0000-4000-8000-00000000000b';

-- ---------------------------------------------------------------------------
-- Founder B (mirror check)
-- ---------------------------------------------------------------------------

select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');

select is(
  (select array_agg(id) from public.idea_applications),
  array['b1000000-0000-4000-8000-0000000000b1'::uuid],
  'founder B sees only their own application'
);
select is(
  (select count(*) from public.application_documents where application_id = 'a1000000-0000-4000-8000-0000000000a1'),
  0::bigint,
  'founder B cannot select founder A''s documents'
);
select is(
  (select array_agg(body) from public.messages),
  array['Hello B'],
  'founder B sees only messages on their own application'
);
select is(
  (select count(*) from public.venture_founders),
  1::bigint,
  'founder B sees their own venture_founders row'
);
select is(
  public.founder_venture_view('b1000000-0000-4000-8000-0000000000b1') ->> 'name',
  'Venture B',
  'founder B reads their own venture through founder_venture_view'
);

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------

select pg_temp.act_as_anon();

select is(pg_temp.visible_rows('public.waitlist'), 0::bigint, 'anon cannot read the waitlist');
select is(pg_temp.visible_rows('public.inquiries'), 0::bigint, 'anon cannot read inquiries');
select is(pg_temp.visible_rows('public.idea_applications'), 0::bigint, 'anon cannot read applications');
select is(pg_temp.visible_rows('public.profiles'), 0::bigint, 'anon cannot read profiles');
select throws_ok(
  $$ insert into public.waitlist (email) values ('direct@pesara.test') $$,
  '42501',
  null,
  'anon cannot insert into the waitlist table directly'
);

-- ---------------------------------------------------------------------------
-- Staff (analyst)
-- ---------------------------------------------------------------------------

select pg_temp.act_as('c0000000-0000-4000-8000-00000000000c');

select is(
  (select count(*) from public.idea_applications
    where id in ('a1000000-0000-4000-8000-0000000000a1', 'b1000000-0000-4000-8000-0000000000b1')),
  2::bigint,
  'staff can read every founder''s application'
);
select is(
  (select count(*) from public.committee_decisions where committee_notes is not null),
  2::bigint,
  'staff can read committee notes'
);
select is(pg_temp.visible_rows('public.waitlist'), 1::bigint, 'staff can read the waitlist');

-- ---------------------------------------------------------------------------
-- Verify nothing leaked through the writes above
-- ---------------------------------------------------------------------------

select pg_temp.act_as_owner();

select is(
  (select role from public.user_roles where user_id = 'a0000000-0000-4000-8000-00000000000a'),
  'FOUNDER',
  'founder A is still a founder'
);
select is(
  (select payload from public.idea_applications where id = 'b1000000-0000-4000-8000-0000000000b1'),
  '{}'::jsonb,
  'founder A''s update did not touch founder B''s application'
);
select is(
  (select full_name from public.profiles where id = 'b0000000-0000-4000-8000-00000000000b'),
  'Founder B',
  'founder A''s update did not touch founder B''s profile'
);

select * from finish();

rollback;
