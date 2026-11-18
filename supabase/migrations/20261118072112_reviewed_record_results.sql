create table public.record_result_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  family_member_id uuid not null,
  source_record_id uuid references public.medical_records(id) on delete set null,
  source_record_key uuid not null,
  source_title text not null check (char_length(source_title) between 1 and 160),
  measured_on date not null check (measured_on <= current_date + 1),
  results jsonb not null check (jsonb_typeof(results) = 'array' and jsonb_array_length(results) between 1 and 100),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (family_member_id, user_id) references public.family_members(id, user_id) on delete restrict
);
create index record_result_reviews_profile on public.record_result_reviews(user_id, family_member_id, source_record_key, created_at desc, id desc);
create index record_result_reviews_source on public.record_result_reviews(source_record_id);
alter table public.record_result_reviews enable row level security;
revoke all on public.record_result_reviews from public, anon, authenticated, service_role;
grant select, insert on public.record_result_reviews to authenticated;
create policy result_reviews_read on public.record_result_reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy result_reviews_insert on public.record_result_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id and source_record_id = source_record_key and exists (
    select 1 from public.medical_records r where r.id = source_record_id
      and r.user_id = (select auth.uid()) and r.family_member_id = record_result_reviews.family_member_id
  ));

create function public.get_reviewed_results()
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc, r.id desc), '[]'::jsonb)
  from public.record_result_reviews r where r.user_id = (select auth.uid());
$$;
revoke all on function public.get_reviewed_results() from public, anon;
grant execute on function public.get_reviewed_results() to authenticated;

create function public.save_reviewed_results(
  p_record_id uuid, p_measured_on date, p_results jsonb, p_confirm_blood_group_change boolean default false
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  source public.medical_records;
  saved public.record_result_reviews;
  previous public.record_result_reviews;
  entry jsonb;
  label text;
  result_value text;
  units text;
  next_height double precision;
  next_weight double precision;
  next_blood text;
  previous_blood text;
  is_self boolean;
begin
  select * into source from public.medical_records where id = p_record_id and user_id = auth.uid();
  if not found then raise exception using errcode = '42501', message = 'Record is not accessible.'; end if;
  perform 1 from public.family_members where id = source.family_member_id and user_id = auth.uid() for update;
  select relationship = 'self' into is_self from public.family_members where id = source.family_member_id;
  if p_measured_on is null or p_measured_on > current_date + 1 or jsonb_typeof(p_results) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Provide a valid measurement date and results.';
  end if;
  if jsonb_array_length(p_results) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Review between one and 100 results.';
  end if;
  for entry in select value from jsonb_array_elements(p_results) loop
    if jsonb_typeof(entry) is distinct from 'object' or exists (
      select 1 from unnest(array['name','value','unit','context','reference_range']) field
      where jsonb_typeof(entry -> field) is distinct from 'string'
    ) then raise exception using errcode = '22023', message = 'Result fields must be text.'; end if;
    label := btrim(entry ->> 'name');
    result_value := btrim(entry ->> 'value');
    units := lower(btrim(entry ->> 'unit'));
    if lower(label) in ('height','weight','blood group') and btrim(entry ->> 'context') <> '' then
      raise exception using errcode = '22023', message = 'Leave context blank for measurements synced to the profile.';
    end if;
    if char_length(label) not between 1 and 80 or char_length(result_value) not between 1 and 100
      or char_length(entry ->> 'unit') > 30 or char_length(entry ->> 'context') > 100 or char_length(entry ->> 'reference_range') > 120 then
      raise exception using errcode = '22023', message = 'Result fields exceed their allowed length.';
    end if;
    if lower(label) in ('height','weight','heart rate','oxygen saturation') then
      if result_value !~ '^[0-9]+([.][0-9]+)?$' then
        raise exception using errcode = '22023', message = 'Vital measurements must be numeric.';
      end if;
      if (lower(label) = 'height' and (units <> 'cm' or result_value::numeric not between 1 and 300))
        or (lower(label) = 'weight' and (units <> 'kg' or result_value::numeric not between 0.1 and 700))
        or (lower(label) = 'heart rate' and (units <> 'bpm' or result_value::numeric not between 20 and 300))
        or (lower(label) = 'oxygen saturation' and (units <> '%' or result_value::numeric not between 1 and 100)) then
        raise exception using errcode = '22023', message = 'Check the vital measurement value and unit.';
      end if;
    end if;
    if lower(label) = 'blood group' and (units <> '' or result_value !~ '^(A|B|AB|O)[+-]$') then
      raise exception using errcode = '22023', message = 'Provide a valid blood group without a unit.';
    end if;
    if lower(label) = 'blood pressure' then
      if units <> 'mmhg' or result_value !~ '^[0-9]{2,3}[ ]*/[ ]*[0-9]{2,3}$' then
        raise exception using errcode = '22023', message = 'Provide blood pressure as systolic/diastolic in mmHg.';
      end if;
      if split_part(result_value,'/',1)::numeric not between 40 and 300 or split_part(result_value,'/',2)::numeric not between 20 and 200
        or split_part(result_value,'/',1)::numeric <= split_part(result_value,'/',2)::numeric then
        raise exception using errcode = '22023', message = 'Check both blood pressure values.';
      end if;
    end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_results) e
    group by lower(btrim(e ->> 'name')), lower(btrim(e ->> 'unit')), lower(btrim(e ->> 'context')) having count(*) > 1
  ) then raise exception using errcode = '22023', message = 'Duplicate test results are not allowed.'; end if;
  select * into previous from public.record_result_reviews
    where source_record_key = source.id order by created_at desc, id desc limit 1;
  if found and previous.measured_on = p_measured_on and previous.results = p_results then return to_jsonb(previous); end if;
  if previous.id is not null and previous.measured_on <> p_measured_on then
    raise exception using errcode = '22023', message = 'A confirmed measurement date is fixed. Upload a corrected report separately.';
  end if;
  if previous.id is not null and exists (
    select 1 from jsonb_array_elements(previous.results) e
    where lower(e ->> 'name') in ('height','weight','blood group') and not exists (
      select 1 from jsonb_array_elements(p_results) n where lower(n ->> 'name') = lower(e ->> 'name')
        and lower(n ->> 'unit') = lower(e ->> 'unit') and lower(n ->> 'context') = lower(e ->> 'context')
    )
  ) then raise exception using errcode = '22023', message = 'Retain or correct previously confirmed profile measurements.'; end if;
  insert into public.record_result_reviews(user_id,family_member_id,source_record_id,source_record_key,source_title,measured_on,results)
    values(auth.uid(),source.family_member_id,source.id,source.id,source.title,p_measured_on,p_results) returning * into saved;
  with current_reviews as (
    select distinct on (source_record_key) * from public.record_result_reviews
    where user_id = auth.uid() and family_member_id = source.family_member_id
    order by source_record_key, created_at desc, id desc
  ), ranked as (
    select r.id, lower(e ->> 'name') label, e ->> 'value' value,
      row_number() over (partition by lower(e ->> 'name') order by r.measured_on desc,r.created_at desc,r.id desc) position
    from current_reviews r cross join lateral jsonb_array_elements(r.results) e
    where (lower(e ->> 'name') = 'height' and lower(e ->> 'unit') = 'cm')
      or (lower(e ->> 'name') = 'weight' and lower(e ->> 'unit') = 'kg')
      or (lower(e ->> 'name') = 'blood group' and e ->> 'unit' = '')
  )
  select max(ranked.value::double precision) filter (where ranked.label = 'height'),
    max(ranked.value::double precision) filter (where ranked.label = 'weight'),
    max(ranked.value) filter (where ranked.label = 'blood group')
  into next_height,next_weight,next_blood from ranked where ranked.position = 1 and ranked.id = saved.id;
  if is_self then select blood_group into previous_blood from public.health_profiles where user_id = auth.uid();
  else select blood_group into previous_blood from public.family_health_profiles where family_member_id = source.family_member_id; end if;
  if next_blood is not null and previous_blood is not null and next_blood <> previous_blood and not coalesce(p_confirm_blood_group_change,false) then
    raise exception using errcode = '22023', message = 'Confirm the conflicting blood group against the original report.';
  end if;
  if next_height is not null or next_weight is not null or next_blood is not null then
    if is_self then
      insert into public.health_profiles(user_id,full_name,height_cm,weight_kg,blood_group)
      select auth.uid(),full_name,next_height,next_weight,next_blood from public.profiles where id = auth.uid()
      on conflict (user_id) do update set height_cm = coalesce(excluded.height_cm,health_profiles.height_cm),
        weight_kg = coalesce(excluded.weight_kg,health_profiles.weight_kg), blood_group = coalesce(excluded.blood_group,health_profiles.blood_group), updated_at = clock_timestamp();
    else
      insert into public.family_health_profiles(user_id,family_member_id,height_cm,weight_kg,blood_group)
      values(auth.uid(),source.family_member_id,next_height,next_weight,next_blood)
      on conflict (family_member_id) do update set height_cm = coalesce(excluded.height_cm,family_health_profiles.height_cm),
        weight_kg = coalesce(excluded.weight_kg,family_health_profiles.weight_kg), blood_group = coalesce(excluded.blood_group,family_health_profiles.blood_group), updated_at = clock_timestamp();
    end if;
  end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_reviewed_results(uuid,date,jsonb,boolean) from public, anon;
grant execute on function public.save_reviewed_results(uuid,date,jsonb,boolean) to authenticated;

create function private.keep_reviewed_record_profile()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.family_member_id <> old.family_member_id and exists (
    select 1 from public.record_result_reviews where source_record_id = old.id
  ) then raise exception using errcode = '23514', message = 'A record with reviewed results cannot change family profile.'; end if;
  return new;
end;
$$;
revoke all on function private.keep_reviewed_record_profile() from public,anon,authenticated;
create trigger keep_reviewed_record_profile before update of family_member_id on public.medical_records
  for each row execute function private.keep_reviewed_record_profile();

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
    );
$$;