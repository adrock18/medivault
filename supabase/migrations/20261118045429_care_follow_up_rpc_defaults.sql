drop function public.save_visit_follow_up(uuid, date, text, uuid, text, uuid);

create function public.save_visit_follow_up(
  p_visit_id uuid,
  p_due_date date,
  p_instruction text,
  p_status text,
  p_source_record_id uuid default null,
  p_completed_visit_id uuid default null
)
returns setof public.visit_follow_ups
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  saved_follow_up public.visit_follow_ups%rowtype;
begin
  if owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Sign in to save a visit follow-up.';
  end if;

  insert into public.visit_follow_ups (
    user_id,
    family_member_id,
    visit_id,
    due_date,
    instruction,
    source_record_id,
    status,
    completed_visit_id
  )
  select
    owner_id,
    origin.family_member_id,
    origin.id,
    p_due_date,
    p_instruction,
    p_source_record_id,
    p_status,
    case when p_status = 'completed' then p_completed_visit_id else null end
  from public.care_visits as origin
  where origin.id = p_visit_id
    and origin.user_id = owner_id
  on conflict (visit_id) do update set
    due_date = excluded.due_date,
    instruction = excluded.instruction,
    source_record_id = excluded.source_record_id,
    status = excluded.status,
    completed_visit_id = excluded.completed_visit_id,
    updated_at = pg_catalog.transaction_timestamp()
  returning * into saved_follow_up;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The originating visit is not available.';
  end if;

  return next saved_follow_up;
  return;
end;
$$;

revoke all on function public.save_visit_follow_up(uuid, date, text, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.save_visit_follow_up(uuid, date, text, text, uuid, uuid)
  to authenticated;
