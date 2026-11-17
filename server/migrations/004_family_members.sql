BEGIN;
CREATE TABLE family_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK(length(trim(full_name)) BETWEEN 1 AND 120),
  relationship TEXT NOT NULL CHECK(relationship IN ('self','spouse','child','parent','grandparent','other')),
  date_of_birth TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id,user_id)
) STRICT;
INSERT INTO family_members(id,user_id,full_name,relationship,date_of_birth,created_at,updated_at)
SELECT p.id,p.id,COALESCE(h.full_name,p.full_name),'self',h.date_of_birth,p.created_at,p.updated_at
FROM profiles p LEFT JOIN health_profiles h ON h.user_id=p.id;

ALTER TABLE medical_records ADD COLUMN family_member_id TEXT REFERENCES family_members(id) ON DELETE RESTRICT;
ALTER TABLE medications ADD COLUMN family_member_id TEXT REFERENCES family_members(id) ON DELETE RESTRICT;
ALTER TABLE health_metrics ADD COLUMN family_member_id TEXT REFERENCES family_members(id) ON DELETE RESTRICT;
UPDATE medical_records SET family_member_id=user_id;
UPDATE medications SET family_member_id=user_id;
UPDATE health_metrics SET family_member_id=user_id;

CREATE TRIGGER validate_record_family_insert BEFORE INSERT ON medical_records
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for medical record'); END;
CREATE TRIGGER validate_record_family_update BEFORE UPDATE OF family_member_id,user_id ON medical_records
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for medical record'); END;
CREATE TRIGGER validate_medication_family_insert BEFORE INSERT ON medications
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for medication'); END;
CREATE TRIGGER validate_medication_family_update BEFORE UPDATE OF family_member_id,user_id ON medications
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for medication'); END;
CREATE TRIGGER validate_medication_source_family_insert BEFORE INSERT ON medications
WHEN NEW.source_record_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM medical_records
  WHERE id=NEW.source_record_id AND user_id=NEW.user_id AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Medication source record belongs to a different family profile'); END;
CREATE TRIGGER validate_medication_source_family_update BEFORE UPDATE OF source_record_id,family_member_id,user_id ON medications
WHEN NEW.source_record_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM medical_records
  WHERE id=NEW.source_record_id AND user_id=NEW.user_id AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Medication source record belongs to a different family profile'); END;
CREATE TRIGGER protect_linked_record_family_update BEFORE UPDATE OF family_member_id ON medical_records
WHEN EXISTS(
  SELECT 1 FROM medications
  WHERE source_record_id=OLD.id AND user_id=OLD.user_id AND family_member_id<>NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Linked medication belongs to a different family profile'); END;
CREATE TRIGGER validate_metric_family_insert BEFORE INSERT ON health_metrics
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for measurement'); END;
CREATE TRIGGER validate_metric_family_update BEFORE UPDATE OF family_member_id,user_id ON health_metrics
WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE id=NEW.family_member_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT,'Invalid family profile for measurement'); END;

CREATE INDEX family_members_user ON family_members(user_id,created_at,id);
CREATE INDEX records_family_date ON medical_records(user_id,family_member_id,record_date DESC);
CREATE INDEX medications_family_dates ON medications(user_id,family_member_id,start_date,end_date);
CREATE INDEX metrics_family_date ON health_metrics(user_id,family_member_id,measured_at DESC);
PRAGMA user_version = 4;
COMMIT;
