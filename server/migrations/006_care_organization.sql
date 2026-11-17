BEGIN IMMEDIATE;

CREATE TABLE care_tracks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
  kind TEXT NOT NULL CHECK(kind IN ('follow_up','preventive','dental','ongoing','other')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id,user_id,family_member_id),
  FOREIGN KEY(family_member_id,user_id)
    REFERENCES family_members(id,user_id) ON DELETE CASCADE
) STRICT;

CREATE TABLE care_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id TEXT NOT NULL,
  care_track_id TEXT,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
  reason TEXT NOT NULL DEFAULT '' CHECK(length(reason) <= 1000),
  setting TEXT NOT NULL CHECK(setting IN ('primary_care','specialist','dental','hospital','diagnostic','preventive','telehealth','other')),
  provider TEXT NOT NULL DEFAULT '' CHECK(length(provider) <= 160),
  visit_date TEXT NOT NULL CHECK(length(visit_date) = 10),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 2000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id,user_id,family_member_id),
  FOREIGN KEY(family_member_id,user_id)
    REFERENCES family_members(id,user_id) ON DELETE CASCADE
) STRICT;

CREATE TRIGGER validate_visit_track_insert
BEFORE INSERT ON care_visits
WHEN NEW.care_track_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM care_tracks
  WHERE id=NEW.care_track_id
    AND user_id=NEW.user_id
    AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Care track belongs to a different profile'); END;

CREATE TRIGGER validate_visit_track_update
BEFORE UPDATE OF care_track_id,user_id,family_member_id ON care_visits
WHEN NEW.care_track_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM care_tracks
  WHERE id=NEW.care_track_id
    AND user_id=NEW.user_id
    AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Care track belongs to a different profile'); END;

ALTER TABLE medical_records
  ADD COLUMN document_kind TEXT NOT NULL DEFAULT 'other'
  CHECK(document_kind IN ('prescription','lab_report','imaging_report','visit_note','care_instructions','discharge_summary','referral','immunization','dental_record','insurance_claim','other'));
UPDATE medical_records
SET document_kind = CASE category
  WHEN 'prescription' THEN 'prescription'
  WHEN 'lab_report' THEN 'lab_report'
  WHEN 'scan' THEN 'imaging_report'
  WHEN 'discharge_summary' THEN 'discharge_summary'
  ELSE 'other'
END;

ALTER TABLE medical_records
  ADD COLUMN visit_id TEXT REFERENCES care_visits(id) ON DELETE SET NULL;

CREATE TRIGGER validate_record_visit_insert
BEFORE INSERT ON medical_records
WHEN NEW.visit_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM care_visits
  WHERE id=NEW.visit_id
    AND user_id=NEW.user_id
    AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Visit belongs to a different profile'); END;

CREATE TRIGGER validate_record_visit_update
BEFORE UPDATE OF visit_id,user_id,family_member_id ON medical_records
WHEN NEW.visit_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM care_visits
  WHERE id=NEW.visit_id
    AND user_id=NEW.user_id
    AND family_member_id=NEW.family_member_id
)
BEGIN SELECT RAISE(ABORT,'Visit belongs to a different profile'); END;

CREATE INDEX care_tracks_profile ON care_tracks(user_id,family_member_id,created_at DESC);
CREATE INDEX care_visits_profile_date ON care_visits(user_id,family_member_id,visit_date DESC,id);
CREATE INDEX care_visits_track_date ON care_visits(care_track_id,visit_date DESC,id);
CREATE INDEX records_visit_date ON medical_records(user_id,family_member_id,visit_id,record_date DESC);

PRAGMA user_version = 6;
COMMIT;
