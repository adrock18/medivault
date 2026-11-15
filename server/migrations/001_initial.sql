BEGIN;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK(length(trim(full_name)) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE health_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK(length(trim(full_name)) BETWEEN 1 AND 120),
  date_of_birth TEXT,
  gender TEXT CHECK(gender IN ('female','male','non_binary','prefer_not_to_say')),
  blood_group TEXT CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  height_cm REAL CHECK(height_cm > 0 AND height_cm <= 300),
  weight_kg REAL CHECK(weight_kg > 0 AND weight_kg <= 700),
  allergies TEXT NOT NULL DEFAULT '' CHECK(length(allergies) <= 2000),
  conditions TEXT NOT NULL DEFAULT '' CHECK(length(conditions) <= 2000),
  emergency_contact_name TEXT NOT NULL DEFAULT '' CHECK(length(emergency_contact_name) <= 120),
  emergency_contact_phone TEXT NOT NULL DEFAULT '' CHECK(length(emergency_contact_phone) <= 30),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE medical_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
  category TEXT NOT NULL CHECK(category IN ('prescription','lab_report','scan','discharge_summary','other')),
  provider TEXT NOT NULL DEFAULT '' CHECK(length(provider) <= 160),
  record_date TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL CHECK(length(file_name) BETWEEN 1 AND 255),
  file_type TEXT NOT NULL CHECK(file_type IN ('application/pdf','image/jpeg','image/png')),
  file_size INTEGER NOT NULL CHECK(file_size > 0 AND file_size <= 10485760),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(substr(file_path,1,length(user_id)+1) = user_id || '/')
) STRICT;
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
  dosage TEXT NOT NULL CHECK(length(trim(dosage)) BETWEEN 1 AND 120),
  frequency TEXT NOT NULL CHECK(frequency IN ('once_daily','twice_daily','three_daily','custom')),
  times TEXT NOT NULL CHECK(json_valid(times) AND json_type(times) = 'array' AND json_array_length(times) BETWEEN 1 AND 12),
  start_date TEXT NOT NULL,
  end_date TEXT,
  instructions TEXT NOT NULL DEFAULT '' CHECK(length(instructions) <= 2000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id,user_id),
  CHECK(end_date IS NULL OR end_date >= start_date)
) STRICT;
CREATE TRIGGER validate_medication_times_insert BEFORE INSERT ON medications BEGIN
  SELECT CASE WHEN
    EXISTS(SELECT 1 FROM json_each(NEW.times) WHERE type <> 'text' OR value NOT GLOB '[0-2][0-9]:[0-5][0-9]' OR substr(value,1,2) > '23')
    OR json_array_length(NEW.times) <> (SELECT count(DISTINCT value) FROM json_each(NEW.times))
    OR (NEW.frequency = 'once_daily' AND json_array_length(NEW.times) <> 1)
    OR (NEW.frequency = 'twice_daily' AND json_array_length(NEW.times) <> 2)
    OR (NEW.frequency = 'three_daily' AND json_array_length(NEW.times) <> 3)
  THEN RAISE(ABORT,'Invalid or duplicate medication times') END;
END;
CREATE TRIGGER validate_medication_times_update BEFORE UPDATE OF times,frequency ON medications BEGIN
  SELECT CASE WHEN
    EXISTS(SELECT 1 FROM json_each(NEW.times) WHERE type <> 'text' OR value NOT GLOB '[0-2][0-9]:[0-5][0-9]' OR substr(value,1,2) > '23')
    OR json_array_length(NEW.times) <> (SELECT count(DISTINCT value) FROM json_each(NEW.times))
    OR (NEW.frequency = 'once_daily' AND json_array_length(NEW.times) <> 1)
    OR (NEW.frequency = 'twice_daily' AND json_array_length(NEW.times) <> 2)
    OR (NEW.frequency = 'three_daily' AND json_array_length(NEW.times) <> 3)
  THEN RAISE(ABORT,'Invalid or duplicate medication times') END;
END;
CREATE TABLE medication_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('taken','skipped')),
  logged_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(medication_id,user_id) REFERENCES medications(id,user_id) ON DELETE CASCADE,
  UNIQUE(medication_id,scheduled_date,scheduled_time)
) STRICT;
CREATE TRIGGER validate_dose_insert BEFORE INSERT ON medication_logs BEGIN
  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM medications m WHERE m.id = NEW.medication_id AND m.user_id = NEW.user_id
      AND NEW.scheduled_date >= m.start_date AND (m.end_date IS NULL OR NEW.scheduled_date <= m.end_date)
      AND EXISTS(SELECT 1 FROM json_each(m.times) WHERE value = NEW.scheduled_time)
  ) THEN RAISE(ABORT,'This dose is not part of the medication schedule') END;
END;
CREATE TRIGGER immutable_dose_schedule BEFORE UPDATE ON medication_logs
WHEN NEW.user_id <> OLD.user_id OR NEW.medication_id <> OLD.medication_id
  OR NEW.scheduled_date <> OLD.scheduled_date OR NEW.scheduled_time <> OLD.scheduled_time
BEGIN SELECT RAISE(ABORT,'Dose log schedule identifiers cannot be changed'); END;
CREATE TABLE health_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('blood_pressure','blood_glucose','weight','heart_rate')),
  value REAL NOT NULL,
  secondary_value REAL,
  measured_at TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 1000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(
    (type = 'blood_pressure' AND value BETWEEN 40 AND 300 AND secondary_value BETWEEN 20 AND 200 AND value > secondary_value)
    OR (type = 'blood_glucose' AND value BETWEEN 1 AND 1500 AND secondary_value IS NULL)
    OR (type = 'weight' AND value > 0 AND value <= 700 AND secondary_value IS NULL)
    OR (type = 'heart_rate' AND value BETWEEN 20 AND 300 AND secondary_value IS NULL)
  ),
  CHECK(type <> 'blood_pressure' OR secondary_value IS NOT NULL)
) STRICT;
CREATE TRIGGER validate_metric_date_insert BEFORE INSERT ON health_metrics
WHEN julianday(NEW.measured_at) IS NULL OR julianday(NEW.measured_at) > julianday('now')
BEGIN SELECT RAISE(ABORT,'Measurement date must not be in the future'); END;
CREATE TRIGGER validate_metric_date_update BEFORE UPDATE ON health_metrics
WHEN julianday(NEW.measured_at) IS NULL OR julianday(NEW.measured_at) > julianday('now')
BEGIN SELECT RAISE(ABORT,'Measurement date must not be in the future'); END;
CREATE INDEX records_user_date ON medical_records(user_id,created_at DESC);
CREATE INDEX medications_user_dates ON medications(user_id,start_date,end_date);
CREATE INDEX logs_user_date ON medication_logs(user_id,scheduled_date DESC,scheduled_time DESC);
CREATE INDEX metrics_user_date ON health_metrics(user_id,measured_at DESC);
PRAGMA user_version = 1;
COMMIT;
