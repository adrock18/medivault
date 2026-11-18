create index care_tracks_family_member_user_fk_idx
  on public.care_tracks (family_member_id, user_id);
create index care_visits_track_owner_profile_fk_idx
  on public.care_visits (care_track_id, user_id, family_member_id);
create index care_visits_family_member_user_fk_idx
  on public.care_visits (family_member_id, user_id);
create index family_health_profiles_member_owner_fk_idx
  on public.family_health_profiles (family_member_id, user_id);
create index health_metrics_member_owner_fk_idx
  on public.health_metrics (family_member_id, user_id);
create index medical_records_member_owner_fk_idx
  on public.medical_records (family_member_id, user_id);
create index medical_records_visit_owner_profile_fk_idx
  on public.medical_records (visit_id, user_id, family_member_id);
create index medication_logs_medication_owner_fk_idx
  on public.medication_logs (medication_id, user_id);
create index medications_member_owner_fk_idx
  on public.medications (family_member_id, user_id);
create index medications_source_owner_profile_fk_idx
  on public.medications (source_record_id, user_id, family_member_id);
create index reminder_deliveries_medication_owner_fk_idx
  on public.reminder_deliveries (medication_id, user_id);
create index visit_follow_ups_return_owner_profile_fk_idx
  on public.visit_follow_ups (completed_visit_id, user_id, family_member_id);
create index visit_follow_ups_member_owner_fk_idx
  on public.visit_follow_ups (family_member_id, user_id);
create index visit_follow_ups_source_owner_profile_fk_idx
  on public.visit_follow_ups (source_record_id, user_id, family_member_id);
create index visit_follow_ups_visit_owner_profile_fk_idx
  on public.visit_follow_ups (visit_id, user_id, family_member_id);

create policy reminder_deliveries_deny_ordinary_users
  on public.reminder_deliveries
  as restrictive
  for all to anon, authenticated
  using (false)
  with check (false);