-- Add google_calendar_event_id column to daily_logs table
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_daily_logs_google_calendar_event_id ON daily_logs(google_calendar_event_id);
