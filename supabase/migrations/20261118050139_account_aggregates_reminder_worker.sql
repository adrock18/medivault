create function public.get_account_vault_data()
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
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.created_at desc, m.id)
      from public.medications m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'logs', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) order by l.scheduled_date desc, l.scheduled_time desc, l.id)
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

create function public.get_account_export_data()
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
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.created_at desc, m.id)
      from public.medications m
      where m.user_id = owner_id
    ), '[]'::jsonb),
    'medication_logs', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) order by l.scheduled_date desc, l.scheduled_time desc, l.id)
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

create function public.get_due_reminder_candidates(
  p_now timestamptz default pg_catalog.statement_timestamp()
)
returns table (
  user_id uuid,
  medication_id uuid,
  scheduled_date date,
  scheduled_time time without time zone,
  timezone text
)
language sql
stable
security definer
set search_path = ''
as $$
  with slots as (
    select
      p.user_id,
      p.timezone,
      (slot.instant at time zone p.timezone)::date as scheduled_date,
      (slot.instant at time zone p.timezone)::time without time zone as scheduled_time
    from public.notification_preferences p
    cross join lateral pg_catalog.generate_series(
      p_now - interval '4 minutes',
      p_now,
      interval '1 minute'
    ) as slot(instant)
    where p.email_reminders_enabled
  )
  select distinct
    s.user_id,
    m.id as medication_id,
    s.scheduled_date,
    s.scheduled_time,
    s.timezone
  from slots s
  join public.medications m
    on m.user_id = s.user_id
    and m.start_date <= s.scheduled_date
    and (m.end_date is null or m.end_date >= s.scheduled_date)
    and s.scheduled_time = any(m.times)
  where not exists (
    select 1
    from public.medication_logs l
    where l.medication_id = m.id
      and l.scheduled_date = s.scheduled_date
      and l.scheduled_time = s.scheduled_time
  )
  and not exists (
    select 1
    from public.reminder_deliveries d
    where d.medication_id = m.id
      and d.scheduled_date = s.scheduled_date
      and d.scheduled_time = s.scheduled_time
      and d.status = 'sent'
  )
  order by s.user_id, m.id, s.scheduled_date, s.scheduled_time;
$$;

create function public.claim_reminder_delivery(
  p_user_id uuid,
  p_medication_id uuid,
  p_scheduled_date date,
  p_scheduled_time time without time zone,
  p_attempted_at timestamptz
)
returns table (
  id uuid,
  attempted_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_attempted_at is null or not exists (
    select 1
    from public.notification_preferences p
    join public.medications m
      on m.user_id = p.user_id
    where p.user_id = p_user_id
      and p.email_reminders_enabled
      and m.id = p_medication_id
      and m.start_date <= p_scheduled_date
      and (m.end_date is null or m.end_date >= p_scheduled_date)
      and p_scheduled_time = any(m.times)
      and (p_attempted_at at time zone p.timezone)
        >= p_scheduled_date + p_scheduled_time
      and (p_attempted_at at time zone p.timezone)
        < p_scheduled_date + p_scheduled_time + interval '5 minutes'
      and not exists (
        select 1
        from public.medication_logs l
        where l.medication_id = m.id
          and l.scheduled_date = p_scheduled_date
          and l.scheduled_time = p_scheduled_time
      )
  ) then
    return;
  end if;

  return query
  insert into public.reminder_deliveries as existing_delivery (
    user_id,
    medication_id,
    scheduled_date,
    scheduled_time,
    status,
    attempted_at,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_medication_id,
    p_scheduled_date,
    p_scheduled_time,
    'sending',
    p_attempted_at,
    p_attempted_at,
    p_attempted_at
  )
  on conflict (medication_id, scheduled_date, scheduled_time)
  do update set
    status = 'sending',
    attempted_at = excluded.attempted_at,
    updated_at = excluded.updated_at
  where existing_delivery.status = 'failed'
    or (
      existing_delivery.status = 'sending'
      and existing_delivery.attempted_at
        <= excluded.attempted_at - interval '55 seconds'
    )
  returning existing_delivery.id, existing_delivery.attempted_at;
end;
$$;

create function public.complete_reminder_delivery(
  p_id uuid,
  p_attempted_at timestamptz,
  p_delivered boolean
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  updated boolean;
begin
  update public.reminder_deliveries
  set
    status = case when p_delivered then 'sent' else 'failed' end,
    updated_at = pg_catalog.statement_timestamp()
  where id = p_id
    and status = 'sending'
    and attempted_at = p_attempted_at
  returning true into updated;

  return coalesce(updated, false);
end;
$$;

revoke all on function public.get_account_vault_data()
  from public, anon, service_role;
revoke all on function public.get_account_export_data()
  from public, anon, service_role;
grant execute on function public.get_account_vault_data()
  to authenticated;
grant execute on function public.get_account_export_data()
  to authenticated;

revoke all on function public.get_due_reminder_candidates(timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_reminder_delivery(
  uuid, uuid, date, time without time zone, timestamptz
) from public, anon, authenticated;
revoke all on function public.complete_reminder_delivery(uuid, timestamptz, boolean)
  from public, anon, authenticated;
grant execute on function public.get_due_reminder_candidates(timestamptz)
  to service_role;
grant execute on function public.claim_reminder_delivery(
  uuid, uuid, date, time without time zone, timestamptz
) to service_role;
grant execute on function public.complete_reminder_delivery(uuid, timestamptz, boolean)
  to service_role;
