-- Staff can close an open validation experiment. The activity line keeps only the experiment id.

create or replace function private.log_experiment_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.outcome is not null
    or tg_op = 'UPDATE' and old.outcome is null and new.outcome is not null
  then
    insert into public.activity_logs (actor, action, entity, entity_id, metadata)
    values (
      auth.uid(),
      'EXPERIMENT_COMPLETED',
      'idea_application',
      new.application_id,
      jsonb_build_object('experiment_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists validation_experiments_completed on public.validation_experiments;
create trigger validation_experiments_completed
  after insert or update of outcome on public.validation_experiments
  for each row execute function private.log_experiment_completed();

create or replace function public.complete_validation_experiment(
  p_experiment uuid,
  p_outcome text,
  p_conclusion text,
  p_results text,
  p_evidence text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  application uuid;
  closing text;
  result_text text;
  evidence_text text;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'not staff';
  end if;
  if p_experiment is null or p_outcome not in ('VALIDATED','PARTIALLY_VALIDATED','INVALIDATED','INCONCLUSIVE') then
    raise exception 'invalid outcome';
  end if;

  closing := nullif(btrim(coalesce(p_conclusion, '')), '');
  result_text := btrim(coalesce(p_results, ''));
  evidence_text := btrim(coalesce(p_evidence, ''));
  if (closing is not null and char_length(closing) > 4000)
    or char_length(result_text) > 4000
    or char_length(evidence_text) > 4000
  then
    raise exception 'invalid outcome';
  end if;

  update public.validation_experiments
    set outcome = p_outcome,
        conclusion = coalesce(closing, conclusion)
    where id = p_experiment
      and outcome is null
    returning application_id into application;

  if not found then
    raise exception 'invalid outcome';
  end if;

  if result_text <> '' or evidence_text <> '' then
    insert into public.validation_results (experiment_id, summary, evidence)
    values (
      p_experiment,
      nullif(result_text, ''),
      case when evidence_text = '' then '{}'::jsonb else jsonb_build_object('note', evidence_text) end
    );
  end if;

  update public.idea_applications
    set last_activity_at = now(), updated_at = now()
    where id = application;
end;
$$;

revoke all on function private.log_experiment_completed() from public, anon, authenticated;
revoke all on function public.complete_validation_experiment(uuid, text, text, text, text) from public, anon;
grant execute on function public.complete_validation_experiment(uuid, text, text, text, text) to authenticated;
revoke insert, update, delete on table public.validation_experiments from public, anon, authenticated;
revoke insert, update, delete on table public.validation_results from public, anon, authenticated;
grant select on table public.validation_experiments to authenticated;
grant select on table public.validation_results to authenticated;
