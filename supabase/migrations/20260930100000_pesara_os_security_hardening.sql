-- Pin search_path on trigger/helper functions and stop anonymous callers reaching the founder decision view.
alter function private.next_application_reference() set search_path = public;
alter function private.reject_activity_mutation() set search_path = public;
revoke execute on function public.founder_decision_view(uuid) from anon;
