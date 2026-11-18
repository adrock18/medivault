alter table public.medical_records
  add constraint medical_records_id_user_profile_visit_key
  unique (id, user_id, family_member_id, visit_id);

alter table public.visit_follow_ups
  drop constraint visit_follow_ups_source_record_id_user_id_family_member_id_fkey;
alter table public.visit_follow_ups
  add constraint visit_follow_ups_source_visit_owner_profile_fkey
  foreign key (source_record_id, user_id, family_member_id, visit_id)
  references public.medical_records (id, user_id, family_member_id, visit_id)
  on delete set null (source_record_id);

create function private.clear_visit_follow_up_source()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.visit_id is not distinct from old.visit_id
    and new.user_id is not distinct from old.user_id
    and new.family_member_id is not distinct from old.family_member_id
  then
    return new;
  end if;

  update public.visit_follow_ups
  set source_record_id = null,
    updated_at = pg_catalog.transaction_timestamp()
  where source_record_id = old.id
    and user_id = old.user_id
    and family_member_id = old.family_member_id;

  return new;
end;
$$;

revoke all on function private.clear_visit_follow_up_source()
  from public, anon, authenticated;
create trigger clear_visit_follow_up_source
  before update of visit_id, user_id, family_member_id
  on public.medical_records
  for each row execute function private.clear_visit_follow_up_source();

create function private.validate_visit_follow_up()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  origin public.care_visits%rowtype;
  returned_visit public.care_visits%rowtype;
  visit_lock_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.user_id is distinct from old.user_id
      or new.family_member_id is distinct from old.family_member_id
      or new.visit_id is distinct from old.visit_id
    then
      raise exception using
        errcode = '23514',
        message = 'Follow-up ownership and originating visit cannot be changed.';
    end if;

    if new.due_date is not distinct from old.due_date
      and new.instruction is not distinct from old.instruction
      and new.status is not distinct from old.status
      and (
        new.source_record_id is not distinct from old.source_record_id
        or new.source_record_id is null
      )
      and (
        new.completed_visit_id is not distinct from old.completed_visit_id
        or new.completed_visit_id is null
      )
      and (
        new.source_record_id is distinct from old.source_record_id
        or new.completed_visit_id is distinct from old.completed_visit_id
      )
    then
      return new;
    end if;
  end if;

  for visit_lock_id in
    select distinct candidate.id
    from (values (new.visit_id), (new.completed_visit_id)) as candidate(id)
    where candidate.id is not null
    order by candidate.id
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(visit_lock_id::text, 0)
    );
  end loop;

  select visit.*
  into origin
  from public.care_visits as visit
  where visit.id = new.visit_id
    and visit.user_id = new.user_id
    and visit.family_member_id = new.family_member_id;

  if not found or origin.visit_date > new.due_date then
    raise exception using
      errcode = '23514',
      message = 'Follow-up due date must be on or after its originating visit.';
  end if;

  if new.completed_visit_id is not null then
    if new.status <> 'completed' then
      raise exception using
        errcode = '23514',
        message = 'Only completed follow-ups can reference a return visit.';
    end if;

    select visit.*
    into returned_visit
    from public.care_visits as visit
    where visit.id = new.completed_visit_id
      and visit.user_id = new.user_id
      and visit.family_member_id = new.family_member_id;

    if not found
      or returned_visit.id = origin.id
      or returned_visit.visit_date < origin.visit_date
    then
      raise exception using
        errcode = '23514',
        message = 'Return visit must be a different visit for the same profile on or after the origin.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_visit_follow_up()
  from public, anon, authenticated;
create trigger validate_visit_follow_up
  before insert or update on public.visit_follow_ups
  for each row execute function private.validate_visit_follow_up();

create function private.guard_follow_up_visit_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  visit_lock_id uuid;
begin
  for visit_lock_id in
    select lock_target.id
    from (
      select old.id as id
      union
      select follow_up.visit_id
      from public.visit_follow_ups as follow_up
      where follow_up.completed_visit_id = old.id
    ) as lock_target
    order by lock_target.id
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(visit_lock_id::text, 0)
    );
  end loop;

  if exists (
    select 1
    from public.visit_follow_ups as follow_up
    left join public.care_visits as returned_visit
      on returned_visit.id = follow_up.completed_visit_id
    where follow_up.visit_id = old.id
      and (
        new.user_id is distinct from follow_up.user_id
        or new.family_member_id is distinct from follow_up.family_member_id
        or new.visit_date > follow_up.due_date
        or (
          follow_up.completed_visit_id is not null
          and new.visit_date > returned_visit.visit_date
        )
      )
  ) then
    raise exception using
      errcode = '23514',
      message = 'Update the linked follow-up before changing its originating visit.';
  end if;

  if exists (
    select 1
    from public.visit_follow_ups as follow_up
    join public.care_visits as origin
      on origin.id = follow_up.visit_id
    where follow_up.completed_visit_id = old.id
      and (
        new.user_id is distinct from follow_up.user_id
        or new.family_member_id is distinct from follow_up.family_member_id
        or new.visit_date < origin.visit_date
      )
  ) then
    raise exception using
      errcode = '23514',
      message = 'Update the linked follow-up before changing its return visit.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_follow_up_visit_edit()
  from public, anon, authenticated;
create trigger guard_follow_up_visit_edit
  before update of user_id, family_member_id, visit_date on public.care_visits
  for each row execute function private.guard_follow_up_visit_edit();

create function public.save_visit_follow_up(
  p_visit_id uuid,
  p_due_date date,
  p_instruction text,
  p_source_record_id uuid,
  p_status text,
  p_completed_visit_id uuid
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

revoke all on function public.save_visit_follow_up(uuid, date, text, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.save_visit_follow_up(uuid, date, text, uuid, text, uuid)
  to authenticated;
