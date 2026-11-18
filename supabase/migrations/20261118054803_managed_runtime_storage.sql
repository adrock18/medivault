alter table public.medical_records
  add constraint medical_records_owner_object_path
  check (file_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-records', 'medical-records', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy medical_documents_owner_read
  on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-records'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create function public.check_app_readiness()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    pg_catalog.to_regclass('public.visit_follow_ups') is not null
    and pg_catalog.to_regclass('public.family_health_profiles') is not null
    and pg_catalog.to_regprocedure('public.get_account_vault_data()') is not null
    and pg_catalog.to_regprocedure('public.get_account_export_data()') is not null
    and exists (
      select 1 from pg_catalog.pg_constraint
      where conname = 'medical_records_owner_object_path'
        and conrelid = 'public.medical_records'::regclass
    );
$$;
revoke all on function public.check_app_readiness() from public, anon, authenticated;
grant execute on function public.check_app_readiness() to service_role;