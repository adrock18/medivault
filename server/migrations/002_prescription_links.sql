BEGIN IMMEDIATE;
ALTER TABLE medications ADD COLUMN form TEXT NOT NULL DEFAULT 'unspecified'
  CHECK(form IN ('unspecified','tablet','capsule','cream','ointment','gel','injection','liquid','drops','inhaler','patch','suppository','other'));
ALTER TABLE medications ADD COLUMN strength TEXT NOT NULL DEFAULT '' CHECK(length(strength) <= 120);
ALTER TABLE medications ADD COLUMN source_record_id TEXT REFERENCES medical_records(id) ON DELETE SET NULL;
ALTER TABLE medications ADD COLUMN prescription_text TEXT NOT NULL DEFAULT '' CHECK(length(prescription_text) <= 4000);
CREATE INDEX medications_source_record ON medications(source_record_id);
CREATE TRIGGER validate_medication_source_insert BEFORE INSERT ON medications
WHEN NEW.source_record_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM medical_records WHERE id=NEW.source_record_id AND user_id=NEW.user_id
)
BEGIN SELECT RAISE(ABORT,'Prescription must belong to the medication owner'); END;
CREATE TRIGGER validate_medication_source_update BEFORE UPDATE OF source_record_id,user_id ON medications
WHEN NEW.source_record_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM medical_records WHERE id=NEW.source_record_id AND user_id=NEW.user_id
)
BEGIN SELECT RAISE(ABORT,'Prescription must belong to the medication owner'); END;
PRAGMA user_version = 2;
COMMIT;
