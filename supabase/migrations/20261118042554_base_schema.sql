create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null
    check (char_length(btrim(full_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  full_name text not null
    check (char_length(btrim(full_name)) between 1 and 120),
  date_of_birth date,
  gender text check (
    gender in ('female', 'male', 'non_binary', 'prefer_not_to_say')
  ),
  blood_group text check (
    blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  height_cm double precision check (height_cm > 0 and height_cm <= 300),
  weight_kg double precision check (weight_kg > 0 and weight_kg <= 700),
  allergies text not null default '' check (char_length(allergies) <= 2000),
  conditions text not null default '' check (char_length(conditions) <= 2000),
  emergency_contact_name text not null default ''
    check (char_length(emergency_contact_name) <= 120),
  emergency_contact_phone text not null default ''
    check (char_length(emergency_contact_phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null
    check (char_length(btrim(full_name)) between 1 and 120),
  relationship text not null
    check (relationship in ('self', 'spouse', 'child', 'parent', 'grandparent', 'other')),
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (relationship <> 'self' or id = user_id)
);

create unique index family_members_one_self_per_user
  on public.family_members (user_id)
  where relationship = 'self';
create index family_members_user_created
  on public.family_members (user_id, created_at, id);

create table public.family_health_profiles (
  family_member_id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  gender text check (
    gender in ('female', 'male', 'non_binary', 'prefer_not_to_say')
  ),
  blood_group text check (
    blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  height_cm double precision check (height_cm > 0 and height_cm <= 300),
  weight_kg double precision check (weight_kg > 0 and weight_kg <= 700),
  allergies text not null default '' check (char_length(allergies) <= 2000),
  conditions text not null default '' check (char_length(conditions) <= 2000),
  emergency_contact_name text not null default ''
    check (char_length(emergency_contact_name) <= 120),
  emergency_contact_phone text not null default ''
    check (char_length(emergency_contact_phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict
);
create index family_health_profiles_user
  on public.family_health_profiles (user_id, family_member_id);

create table public.care_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  family_member_id uuid not null,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  kind text not null
    check (kind in ('follow_up', 'preventive', 'dental', 'ongoing', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, family_member_id),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict
);
create index care_tracks_profile
  on public.care_tracks (user_id, family_member_id, created_at desc, id);

create table public.care_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  family_member_id uuid not null,
  care_track_id uuid,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  reason text not null default '' check (char_length(reason) <= 1000),
  setting text not null check (
    setting in (
      'primary_care', 'specialist', 'dental', 'hospital', 'diagnostic',
      'preventive', 'telehealth', 'other'
    )
  ),
  provider text not null default '' check (char_length(provider) <= 160),
  visit_date date not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, family_member_id),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict,
  foreign key (care_track_id, user_id, family_member_id)
    references public.care_tracks (id, user_id, family_member_id)
    on delete set null (care_track_id)
);
create index care_visits_profile_date
  on public.care_visits (user_id, family_member_id, visit_date desc, id);
create index care_visits_track_date
  on public.care_visits (care_track_id, visit_date desc, id);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  category text not null
    check (category in ('prescription', 'lab_report', 'scan', 'discharge_summary', 'other')),
  document_kind text not null default 'other'
    check (document_kind in (
      'prescription', 'lab_report', 'imaging_report', 'visit_note',
      'care_instructions', 'discharge_summary', 'referral', 'immunization',
      'dental_record', 'insurance_claim', 'other'
    )),
  visit_id uuid,
  provider text not null default '' check (char_length(provider) <= 160),
  record_date date not null,
  file_path text not null unique,
  file_name text not null
    check (char_length(file_name) between 1 and 255),
  file_type text not null
    check (file_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size integer not null check (file_size between 1 and 10485760),
  is_favourite boolean not null default false,
  family_member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, family_member_id),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict,
  foreign key (visit_id, user_id, family_member_id)
    references public.care_visits (id, user_id, family_member_id)
    on delete set null (visit_id)
);
create index medical_records_user_created
  on public.medical_records (user_id, created_at desc, id);
create index medical_records_profile_date
  on public.medical_records (user_id, family_member_id, record_date desc, id);
create index medical_records_visit
  on public.medical_records (visit_id);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  dosage text not null
    check (char_length(btrim(dosage)) between 1 and 120),
  form text not null default 'unspecified' check (
    form in (
      'unspecified', 'tablet', 'capsule', 'cream', 'ointment', 'gel',
      'injection', 'liquid', 'drops', 'inhaler', 'patch', 'suppository', 'other'
    )
  ),
  strength text not null default '' check (char_length(strength) <= 120),
  source_record_id uuid,
  prescription_text text not null default ''
    check (char_length(prescription_text) <= 4000),
  family_member_id uuid not null,
  frequency text not null
    check (frequency in ('once_daily', 'twice_daily', 'three_daily', 'custom')),
  times time without time zone[] not null,
  start_date date not null,
  end_date date,
  instructions text not null default '' check (char_length(instructions) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, user_id, family_member_id),
  check (cardinality(times) between 1 and 12),
  check (array_position(times, null) is null),
  check (
    (frequency = 'once_daily' and cardinality(times) = 1) or
    (frequency = 'twice_daily' and cardinality(times) = 2) or
    (frequency = 'three_daily' and cardinality(times) = 3) or
    frequency = 'custom'
  ),
  check (end_date is null or end_date >= start_date),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict,
  foreign key (source_record_id, user_id, family_member_id)
    references public.medical_records (id, user_id, family_member_id)
    on delete set null (source_record_id)
);
create index medications_user_created
  on public.medications (user_id, created_at desc, id);
create index medications_profile_dates
  on public.medications (user_id, family_member_id, start_date, end_date);
create index medications_source_record
  on public.medications (source_record_id);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  medication_id uuid not null,
  scheduled_date date not null,
  scheduled_time time without time zone not null,
  status text not null check (status in ('taken', 'skipped')),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medication_id, scheduled_date, scheduled_time),
  foreign key (medication_id, user_id)
    references public.medications (id, user_id) on delete cascade
);
create index medication_logs_user_date
  on public.medication_logs (user_id, scheduled_date desc, scheduled_time desc, id);

create table public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('blood_pressure', 'blood_glucose', 'weight', 'heart_rate')),
  value double precision not null,
  secondary_value double precision,
  measured_at timestamptz not null,
  notes text not null default '' check (char_length(notes) <= 1000),
  family_member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'blood_pressure' and value between 40 and 300
      and secondary_value between 20 and 200 and value > secondary_value) or
    (type = 'blood_glucose' and value between 1 and 1500
      and secondary_value is null) or
    (type = 'weight' and value > 0 and value <= 700
      and secondary_value is null) or
    (type = 'heart_rate' and value between 20 and 300
      and secondary_value is null)
  ),
  check (type <> 'blood_pressure' or secondary_value is not null),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict
);
create index health_metrics_user_date
  on public.health_metrics (user_id, measured_at desc, id);
create index health_metrics_profile_date
  on public.health_metrics (user_id, family_member_id, measured_at desc, id);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_reminders_enabled boolean not null default false,
  timezone text not null default 'UTC'
    check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visit_follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  family_member_id uuid not null,
  visit_id uuid not null unique,
  due_date date not null,
  instruction text not null default '' check (char_length(instruction) <= 2000),
  source_record_id uuid,
  status text not null check (status in ('pending', 'completed', 'cancelled')),
  completed_visit_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_visit_id is null or status = 'completed'),
  foreign key (family_member_id, user_id)
    references public.family_members (id, user_id) on delete restrict,
  foreign key (visit_id, user_id, family_member_id)
    references public.care_visits (id, user_id, family_member_id) on delete cascade,
  foreign key (source_record_id, user_id, family_member_id)
    references public.medical_records (id, user_id, family_member_id)
    on delete set null (source_record_id),
  foreign key (completed_visit_id, user_id, family_member_id)
    references public.care_visits (id, user_id, family_member_id)
    on delete set null (completed_visit_id)
);
create index visit_follow_ups_profile_due
  on public.visit_follow_ups (user_id, family_member_id, status, due_date, id);
create index visit_follow_ups_source
  on public.visit_follow_ups (source_record_id);
create index visit_follow_ups_return
  on public.visit_follow_ups (completed_visit_id);

create table public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  medication_id uuid not null,
  scheduled_date date not null,
  scheduled_time time without time zone not null,
  status text not null check (status in ('sending', 'sent', 'failed')),
  attempted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medication_id, scheduled_date, scheduled_time),
  foreign key (medication_id, user_id)
    references public.medications (id, user_id) on delete cascade
);
create index reminder_deliveries_status
  on public.reminder_deliveries (user_id, status, attempted_at);

create function private.bootstrap_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  if display_name is null or char_length(display_name) > 120 then
    raise exception using
      errcode = '23514',
      message = 'A valid full name is required to initialize the account.';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, display_name);
  insert into public.family_members (id, user_id, full_name, relationship)
  values (new.id, new.id, display_name, 'self');
  insert into public.notification_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

revoke all on function private.bootstrap_new_auth_user()
  from public, anon, authenticated;
grant execute on function private.bootstrap_new_auth_user()
  to supabase_auth_admin;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.bootstrap_new_auth_user();

alter table public.profiles enable row level security;
alter table public.health_profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.family_health_profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.health_metrics enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.care_tracks enable row level security;
alter table public.care_visits enable row level security;
alter table public.visit_follow_ups enable row level security;
alter table public.reminder_deliveries enable row level security;

revoke all on schema public from public, anon;
grant usage on schema public to authenticated, service_role;

revoke all on table
  public.profiles,
  public.health_profiles,
  public.family_members,
  public.family_health_profiles,
  public.medical_records,
  public.medications,
  public.medication_logs,
  public.health_metrics,
  public.notification_preferences,
  public.care_tracks,
  public.care_visits,
  public.visit_follow_ups,
  public.reminder_deliveries
from public, anon, authenticated, service_role;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.health_profiles to authenticated;
grant select, insert, update, delete on public.family_members to authenticated;
grant select, insert, update, delete on public.family_health_profiles to authenticated;
grant select, insert, update, delete on public.medical_records to authenticated;
grant select, insert, update, delete on public.medications to authenticated;
grant select, insert, update, delete on public.medication_logs to authenticated;
grant select on public.health_metrics to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.care_tracks to authenticated;
grant select, insert, update, delete on public.care_visits to authenticated;
grant select, insert, update, delete on public.visit_follow_ups to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy health_profiles_owner_all on public.health_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy family_members_select_own on public.family_members
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy family_members_insert_managed on public.family_members
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and relationship <> 'self'
    and id <> user_id
  );
create policy family_members_update_managed on public.family_members
  for update to authenticated
  using ((select auth.uid()) = user_id and relationship <> 'self')
  with check (
    (select auth.uid()) = user_id
    and relationship <> 'self'
    and id <> user_id
  );
create policy family_members_delete_managed on public.family_members
  for delete to authenticated
  using ((select auth.uid()) = user_id and relationship <> 'self');

create policy family_health_profiles_owner_all on public.family_health_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy medical_records_owner_all on public.medical_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy medications_owner_all on public.medications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy medication_logs_owner_all on public.medication_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy health_metrics_select_own on public.health_metrics
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notification_preferences_owner_all
  on public.notification_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy care_tracks_owner_all on public.care_tracks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy care_visits_owner_all on public.care_visits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy visit_follow_ups_owner_all on public.visit_follow_ups
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on schema private is 'Not exposed through the Supabase Data API.';