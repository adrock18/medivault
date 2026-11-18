alter table public.family_health_profiles
  drop constraint family_health_profiles_family_member_id_user_id_fkey;
alter table public.family_health_profiles
  add constraint family_health_profiles_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete cascade;

alter table public.care_tracks
  drop constraint care_tracks_family_member_id_user_id_fkey;
alter table public.care_tracks
  add constraint care_tracks_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

alter table public.care_visits
  drop constraint care_visits_family_member_id_user_id_fkey;
alter table public.care_visits
  add constraint care_visits_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

alter table public.medical_records
  drop constraint medical_records_family_member_id_user_id_fkey;
alter table public.medical_records
  add constraint medical_records_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

alter table public.medications
  drop constraint medications_family_member_id_user_id_fkey;
alter table public.medications
  add constraint medications_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

alter table public.health_metrics
  drop constraint health_metrics_family_member_id_user_id_fkey;
alter table public.health_metrics
  add constraint health_metrics_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

alter table public.visit_follow_ups
  drop constraint visit_follow_ups_family_member_id_user_id_fkey;
alter table public.visit_follow_ups
  add constraint visit_follow_ups_family_member_id_user_id_fkey
  foreign key (family_member_id, user_id)
  references public.family_members (id, user_id)
  on delete no action deferrable initially deferred;

create function private.sync_owner_health_profile_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is distinct from new.user_id
    or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id)
  then
    raise exception using
      errcode = '42501',
      message = 'Health profile ownership must match the signed-in user.';
  end if;

  if tg_op = 'UPDATE' and new.full_name is not distinct from old.full_name then
    return new;
  end if;

  new.updated_at := pg_catalog.transaction_timestamp();

  update public.profiles
  set full_name = new.full_name, updated_at = new.updated_at
  where id = new.user_id;
  if not found then
    raise exception using
      errcode = '23503',
      message = 'The account profile is missing.';
  end if;

  update public.family_members
  set full_name = new.full_name, updated_at = new.updated_at
  where id = new.user_id
    and user_id = new.user_id
    and relationship = 'self';
  if not found then
    raise exception using
      errcode = '23503',
      message = 'The account self profile is missing.';
  end if;

  return new;
end;
$$;

revoke all on function private.sync_owner_health_profile_name()
  from public, anon, authenticated;
create trigger sync_owner_health_profile_name
  before insert or update on public.health_profiles
  for each row execute function private.sync_owner_health_profile_name();

create function private.reject_self_family_health_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.family_members
    where id = new.family_member_id
      and user_id = new.user_id
      and relationship = 'self'
  ) then
    raise exception using
      errcode = '23514',
      message = 'The owner health profile is stored separately.';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_self_family_health_profile()
  from public, anon, authenticated;
create trigger reject_self_family_health_profile
  before insert or update on public.family_health_profiles
  for each row execute function private.reject_self_family_health_profile();

create function private.validate_medication_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  distinct_time_count integer;
begin
  if array_position(new.times, null) is not null then
    raise exception using
      errcode = '23514',
      message = 'Medication schedule times cannot be null.';
  end if;

  select count(distinct schedule_time)
  into distinct_time_count
  from pg_catalog.unnest(new.times) as schedule(schedule_time);

  if distinct_time_count <> cardinality(new.times) then
    raise exception using
      errcode = '23514',
      message = 'Medication schedule times must be unique.';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(new.times) as schedule(schedule_time)
    where pg_catalog.date_part('second', schedule_time) <> 0
  ) then
    raise exception using
      errcode = '23514',
      message = 'Medication schedule times must use HH:mm precision.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_medication_schedule()
  from public, anon, authenticated;
create trigger validate_medication_schedule
  before insert or update on public.medications
  for each row execute function private.validate_medication_schedule();

create function private.validate_medication_log_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  medication_schedule record;
begin
  select start_date, end_date, times
  into medication_schedule
  from public.medications
  where id = new.medication_id
    and user_id = new.user_id
  for share;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'Dose log medication is not available to this owner.';
  end if;

  if new.scheduled_date < medication_schedule.start_date
    or (
      medication_schedule.end_date is not null
      and new.scheduled_date > medication_schedule.end_date
    )
    or not (new.scheduled_time = any(medication_schedule.times))
  then
    raise exception using
      errcode = '23514',
      message = 'Dose log time is not part of the medication schedule.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_medication_log_schedule()
  from public, anon, authenticated;
create trigger validate_medication_log_schedule
  before insert on public.medication_logs
  for each row execute function private.validate_medication_log_schedule();

create function private.prevent_dose_coordinate_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.medication_id is distinct from old.medication_id
    or new.scheduled_date is distinct from old.scheduled_date
    or new.scheduled_time is distinct from old.scheduled_time
  then
    raise exception using
      errcode = '23514',
      message = 'Dose log schedule coordinates cannot be changed.';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_dose_coordinate_change()
  from public, anon, authenticated;
create trigger prevent_dose_coordinate_change
  before update on public.medication_logs
  for each row execute function private.prevent_dose_coordinate_change();