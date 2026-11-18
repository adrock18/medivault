create or replace function public.get_due_reminder_candidates(
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
      pg_catalog.date_trunc('minute', p_now) - interval '4 minutes',
      pg_catalog.date_trunc('minute', p_now),
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
