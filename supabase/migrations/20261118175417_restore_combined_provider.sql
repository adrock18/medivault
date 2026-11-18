-- Restore one provider field without discarding names entered since the split.
begin;

set local lock_timeout = '5s';

alter table public.care_visits
  drop constraint care_visits_retired_provider_empty,
  drop constraint care_visits_provider_check;
alter table public.medical_records
  drop constraint medical_records_retired_provider_empty,
  drop constraint medical_records_provider_check;

update public.care_visits
set provider = concat_ws(' / ', nullif(btrim(hospital_name), ''), nullif(btrim(doctor_name), ''))
where hospital_name <> '' or doctor_name <> '';
update public.medical_records
set provider = concat_ws(' / ', nullif(btrim(hospital_name), ''), nullif(btrim(doctor_name), ''))
where hospital_name <> '' or doctor_name <> '';

-- Two former 160-character names plus a three-character separator fit losslessly.
alter table public.care_visits
  add constraint care_visits_provider_combined_length check (char_length(provider) <= 323),
  drop column hospital_name,
  drop column doctor_name;
alter table public.medical_records
  add constraint medical_records_provider_combined_length check (char_length(provider) <= 323),
  drop column hospital_name,
  drop column doctor_name;

comment on column public.care_visits.provider is
  'Optional combined hospital/doctor name; blank means not recorded.';
comment on column public.medical_records.provider is
  'Editable combined hospital/doctor snapshot, initially copied from the selected visit.';

create or replace function public.check_app_readiness()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select pg_catalog.to_regclass('public.visit_follow_ups') is not null
    and pg_catalog.to_regclass('public.family_health_profiles') is not null
    and pg_catalog.to_regclass('public.record_result_reviews') is not null
    and pg_catalog.to_regprocedure('public.get_account_vault_data()') is not null
    and pg_catalog.to_regprocedure('public.get_account_export_data()') is not null
    and pg_catalog.to_regprocedure('public.get_reviewed_results()') is not null
    and pg_catalog.to_regprocedure('public.save_reviewed_results(uuid,date,jsonb,boolean)') is not null
    and exists (
      select 1 from pg_catalog.pg_constraint
      where conname = 'medical_records_owner_object_path'
        and conrelid = 'public.medical_records'::regclass
    )
    and not exists (
      select 1
      from (values ('care_visits'), ('medical_records')) as tables(name)
      where not exists (
        select 1 from pg_catalog.pg_attribute as attribute
        where attribute.attrelid = pg_catalog.to_regclass('public.' || tables.name)
          and attribute.attname = 'provider'
          and attribute.atttypid = 'pg_catalog.text'::regtype
          and attribute.attnotnull
          and not attribute.attisdropped
      ) or not exists (
        select 1 from pg_catalog.pg_constraint as constraint_info
        where constraint_info.conrelid = pg_catalog.to_regclass('public.' || tables.name)
          and constraint_info.conname = tables.name || '_provider_combined_length'
          and constraint_info.contype = 'c'
          and constraint_info.convalidated
      )
    );
$$;

revoke all on function public.check_app_readiness() from public, anon, authenticated;
grant execute on function public.check_app_readiness() to service_role;

commit;