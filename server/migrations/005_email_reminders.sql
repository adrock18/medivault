BEGIN;
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_reminders_enabled INTEGER NOT NULL DEFAULT 0 CHECK(email_reminders_enabled IN (0,1)),
  timezone TEXT NOT NULL DEFAULT 'UTC' CHECK(length(timezone) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
INSERT INTO notification_preferences(user_id,created_at,updated_at)
SELECT id,created_at,updated_at FROM users;

CREATE TABLE reminder_deliveries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sending','sent','failed')),
  attempted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(medication_id,user_id) REFERENCES medications(id,user_id) ON DELETE CASCADE,
  UNIQUE(medication_id,scheduled_date,scheduled_time)
) STRICT;
CREATE INDEX reminder_preferences_enabled ON notification_preferences(email_reminders_enabled,user_id);
CREATE INDEX reminder_deliveries_status ON reminder_deliveries(user_id,status,attempted_at);
PRAGMA user_version = 5;
COMMIT;
