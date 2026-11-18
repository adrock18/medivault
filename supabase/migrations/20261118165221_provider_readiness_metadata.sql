-- Inspect schema metadata without granting service_role access to patient tables.
begin;

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
      cross join (values ('hospital_name'), ('doctor_name')) as columns(name)
      where not exists (
        select 1 from pg_catalog.pg_attribute as attribute
        where attribute.attrelid = pg_catalog.to_regclass('public.' || tables.name)
          and attribute.attname = columns.name
          and attribute.atttypid = 'pg_catalog.text'::regtype
          and attribute.attnotnull
          and not attribute.attisdropped
      )
    );
$$;

revoke all on function public.check_app_readiness() from public, anon, authenticated;
grant execute on function public.check_app_readiness() to service_role;

commit;