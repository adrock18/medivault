drop index public.visit_follow_ups_source;
drop index public.visit_follow_ups_source_owner_profile_fk_idx;
create index visit_follow_ups_source_visit_owner_profile_fk_idx
  on public.visit_follow_ups (
    source_record_id,
    user_id,
    family_member_id,
    visit_id
  );
