alter table public.health_profiles
  add column medical_background jsonb;
alter table public.family_health_profiles
  add column medical_background jsonb;

-- NULL retains legacy free text until the person first saves structured entries.
create function private.validate_medical_background()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  entry jsonb;
  allergy_names text[] := '{}';
  condition_names text[] := '{}';
begin
  if new.medical_background is null then
    return new;
  end if;

  if pg_catalog.jsonb_typeof(new.medical_background) <> 'array' then
    raise exception using errcode = '23514',
      message = 'Medical background must be an array.';
  end if;
  if pg_catalog.jsonb_array_length(new.medical_background) > 20 then
    raise exception using errcode = '23514',
      message = 'Use up to 20 medical-background entries.';
  end if;

  if tg_op = 'UPDATE' then
    if new.medical_background is not distinct from old.medical_background
      and (new.allergies, new.conditions) is distinct from (old.allergies, old.conditions)
    then
      raise exception using errcode = '23514',
        message = 'Update medical background using structured entries. Refresh the page and try again.';
    end if;
  end if;

  for entry in select value from pg_catalog.jsonb_array_elements(new.medical_background)
  loop
    if pg_catalog.jsonb_typeof(entry) is distinct from 'object'
      or pg_catalog.jsonb_typeof(entry -> 'type') is distinct from 'string'
      or (entry ->> 'type') not in ('allergy', 'condition')
      or pg_catalog.jsonb_typeof(entry -> 'name') is distinct from 'string'
      or pg_catalog.char_length(pg_catalog.btrim(entry ->> 'name')) = 0
      or pg_catalog.char_length(entry ->> 'name') > 2000
      or pg_catalog.jsonb_typeof(entry -> 'instructions') is distinct from 'string'
      or pg_catalog.char_length(entry ->> 'instructions') > 2000
      or entry - array['type', 'name', 'instructions'] <> '{}'::jsonb
    then
      raise exception using errcode = '23514',
        message = 'Each medical-background entry needs a valid type, name, and instructions text (up to 2,000 characters each).';
    end if;
    if entry ->> 'type' = 'allergy' then
      allergy_names := pg_catalog.array_append(allergy_names, entry ->> 'name');
    else
      condition_names := pg_catalog.array_append(condition_names, entry ->> 'name');
    end if;
  end loop;

  new.allergies := pg_catalog.array_to_string(allergy_names, E'\n');
  new.conditions := pg_catalog.array_to_string(condition_names, E'\n');
  return new;
end;
$$;

revoke all on function private.validate_medical_background()
  from public, anon, authenticated;

create trigger validate_medical_background
  before insert or update on public.health_profiles
  for each row execute function private.validate_medical_background();
create trigger validate_medical_background
  before insert or update on public.family_health_profiles
  for each row execute function private.validate_medical_background();