BEGIN IMMEDIATE;
ALTER TABLE medical_records ADD COLUMN is_favourite INTEGER NOT NULL DEFAULT 0
  CHECK(is_favourite IN (0, 1));
PRAGMA user_version = 3;
COMMIT;
