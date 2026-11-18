create or replace function public.get_account_vault_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'An authenticated account is required.';
  end if;

  if not exists (
    select 1 from public.profiles where id = owner_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'The account profile is missing.';
  end if;

  return pg_catalog.jsonb_build_object(
    'profile', (
      select pg_catalog.to_jsonb(p)
      from public.profiles p
      where p.id = owner_id
    ),
    'notificationPreferences', (
      select pg_catalog.to_jsonb(p)
      from public.notification_preferences p
      where p.user_id = owner_id
    ),
    'familyMembers', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.created_at, m.id)
      from public.family_members m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'healthProfile', (
      select pg_catalog.to_jsonb(p)
      from public.health_profiles p
      where p.user_id = owner_id
    ),
    'familyHealthProfiles', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) order by p.family_member_id)
      from public.family_health_profiles p
      where p.user_id = owner_id
    ), '[]'::jsonb),
    'records', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) order by r.created_at desc, r.id)
      from public.medical_records r
      where r.user_id = owner_id
    ), '[]'::jsonb),
    'medications', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(m) || pg_catalog.jsonb_build_object(
          'times',
          (
            select coalesce(
              pg_catalog.jsonb_agg(
                pg_catalog.to_char(s.schedule_time, 'HH24:MI')
                order by s.ordinality
              ),
              '[]'::jsonb
            )
            from pg_catalog.unnest(m.times) with ordinality
              as s(schedule_time, ordinality)
          )
        )
        order by m.created_at desc, m.id
      )
      from public.medications m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'logs', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(l) || pg_catalog.jsonb_build_object(
          'scheduled_time', pg_catalog.to_char(l.scheduled_time, 'HH24:MI')
        )
        order by l.scheduled_date desc, l.scheduled_time desc, l.id
      )
      from public.medication_logs l
      where l.user_id = owner_id
    ), '[]'::jsonb),
    'careTracks', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) order by t.created_at desc, t.id)
      from public.care_tracks t
      where t.user_id = owner_id
    ), '[]'::jsonb),
    'visits', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(v) order by v.visit_date desc, v.id)
      from public.care_visits v
      where v.user_id = owner_id
    ), '[]'::jsonb),
    'followUps', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(f) order by f.due_date, f.id)
      from public.visit_follow_ups f
      where f.user_id = owner_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.get_account_export_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'An authenticated account is required.';
  end if;

  if not exists (
    select 1 from public.profiles where id = owner_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'The account profile is missing.';
  end if;

  return pg_catalog.jsonb_build_object(
    'exported_at', pg_catalog.transaction_timestamp(),
    'profile', (
      select pg_catalog.to_jsonb(p)
      from public.profiles p
      where p.id = owner_id
    ),
    'family_members', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.created_at, m.id)
      from public.family_members m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'health_profile', (
      select pg_catalog.to_jsonb(p)
      from public.health_profiles p
      where p.user_id = owner_id
    ),
    'family_health_profiles', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) order by p.family_member_id)
      from public.family_health_profiles p
      where p.user_id = owner_id
    ), '[]'::jsonb),
    'medical_records', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) order by r.record_date desc, r.id)
      from public.medical_records r
      where r.user_id = owner_id
    ), '[]'::jsonb),
    'medications', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(m) || pg_catalog.jsonb_build_object(
          'times',
          (
            select coalesce(
              pg_catalog.jsonb_agg(
                pg_catalog.to_char(s.schedule_time, 'HH24:MI')
                order by s.ordinality
              ),
              '[]'::jsonb
            )
            from pg_catalog.unnest(m.times) with ordinality
              as s(schedule_time, ordinality)
          )
        )
        order by m.created_at desc, m.id
      )
      from public.medications m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'medication_logs', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(l) || pg_catalog.jsonb_build_object(
          'scheduled_time', pg_catalog.to_char(l.scheduled_time, 'HH24:MI')
        )
        order by l.scheduled_date desc, l.scheduled_time desc, l.id
      )
      from public.medication_logs l
      where l.user_id = owner_id
    ), '[]'::jsonb),
    'care_tracks', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) order by t.created_at desc, t.id)
      from public.care_tracks t
      where t.user_id = owner_id
    ), '[]'::jsonb),
    'care_visits', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(v) order by v.visit_date desc, v.id)
      from public.care_visits v
      where v.user_id = owner_id
    ), '[]'::jsonb),
    'visit_follow_ups', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(f) order by f.due_date, f.id)
      from public.visit_follow_ups f
      where f.user_id = owner_id
    ), '[]'::jsonb),
    'archived_health_metrics', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.measured_at desc, m.id)
      from public.health_metrics m
      where m.user_id = owner_id
    ), '[]'::jsonb)
  );
end;
$$;
