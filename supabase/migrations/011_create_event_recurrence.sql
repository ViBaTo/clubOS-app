-- Migration 011: Create event_recurrence table
-- Stores recurrence patterns for recurring calendar events

-- Create recurrence_frequency enum
DO $$ BEGIN
  CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create event_recurrence table
CREATE TABLE IF NOT EXISTS event_recurrence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  frequency recurrence_frequency NOT NULL,
  interval_value integer DEFAULT 1,
  days_of_week integer[] DEFAULT '{}',
  end_date date,
  occurrences integer,
  exceptions date[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(event_id),
  CONSTRAINT valid_interval CHECK (interval_value > 0)
);

-- Create trigger function to validate days_of_week values (0-6)
CREATE OR REPLACE FUNCTION validate_days_of_week()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.days_of_week IS NOT NULL AND array_length(NEW.days_of_week, 1) > 0 THEN
    IF EXISTS (SELECT 1 FROM unnest(NEW.days_of_week) AS d WHERE d < 0 OR d > 6) THEN
      RAISE EXCEPTION 'days_of_week values must be between 0 and 6';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS tr_validate_days_of_week ON event_recurrence;
CREATE TRIGGER tr_validate_days_of_week
  BEFORE INSERT OR UPDATE ON event_recurrence
  FOR EACH ROW
  EXECUTE FUNCTION validate_days_of_week();

-- Create index for event lookups
CREATE INDEX IF NOT EXISTS idx_event_recurrence_event ON event_recurrence(event_id);

-- Add comments for documentation
COMMENT ON TABLE event_recurrence IS 'Recurrence patterns for recurring calendar events';
COMMENT ON COLUMN event_recurrence.frequency IS 'Recurrence frequency: daily, weekly, monthly';
COMMENT ON COLUMN event_recurrence.interval_value IS 'Interval between occurrences (e.g., every 2 weeks)';
COMMENT ON COLUMN event_recurrence.days_of_week IS 'Array of days (0-6, Sunday-Saturday) for weekly recurrence';
COMMENT ON COLUMN event_recurrence.end_date IS 'Date when recurrence ends (alternative to occurrences)';
COMMENT ON COLUMN event_recurrence.occurrences IS 'Number of occurrences (alternative to end_date)';
COMMENT ON COLUMN event_recurrence.exceptions IS 'Array of dates to skip in the recurrence pattern';
