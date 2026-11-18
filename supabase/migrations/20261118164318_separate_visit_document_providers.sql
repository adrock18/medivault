-- Reset only legacy combined provider text, as authorized for all accounts.
-- Records, files, ownership and every other health-data field remain intact.
begin;

set local lock_timeout = '5s';

alter table public.care_visits
  add column hospital_name text not null default ''
    check (char_length(hospital_name) <= 160),
  add column doctor_name text not null default ''
    check (char_length(doctor_name) <= 160);

alter table public.medical_records
  add column hospital_name text not null default ''
    check (char_length(hospital_name) <= 160),
  add column doctor_name text not null default ''
    check (char_length(doctor_name) <= 160);

update public.care_visits set provider = '' where provider <> '';
update public.medical_records set provider = '' where provider <> '';

-- Reject stale clients instead of letting the retired field collect data again.
alter table public.care_visits
  add constraint care_visits_retired_provider_empty check (provider = '');
alter table public.medical_records
  add constraint medical_records_retired_provider_empty check (provider = '');

comment on column public.care_visits.hospital_name is
  'Explicit facility name; blank means not recorded.';
comment on column public.care_visits.doctor_name is
  'Explicit clinician name; blank means not recorded.';
comment on column public.medical_records.hospital_name is
  'Document facility snapshot, initially copied from the selected visit.';
comment on column public.medical_records.doctor_name is
  'Document clinician snapshot, initially copied from the selected visit.';

commit;