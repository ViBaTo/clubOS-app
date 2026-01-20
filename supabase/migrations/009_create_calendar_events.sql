-- Migration 009: Create calendar_events table with enums
-- This is the core table for the calendar/scheduling system

-- Create event_type enum
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('private_class', 'group_class', 'academy', 'court_rental', 'tournament', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create event_status enum
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('confirmed', 'pending', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'pending',
  instructor_id uuid REFERENCES club_staff(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  price numeric(10,2),
  max_participants integer,
  current_participants integer DEFAULT 0,
  color varchar(7),
  notes text,
  metadata jsonb DEFAULT '{}',
  parent_event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  is_recurring boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_participants CHECK (current_participants <= max_participants OR max_participants IS NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_instructor ON calendar_events(instructor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_facility ON calendar_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent ON calendar_events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS tr_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER tr_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE calendar_events IS 'Calendar events for classes, rentals, tournaments, etc.';
COMMENT ON COLUMN calendar_events.event_type IS 'Type of event: private_class, group_class, academy, court_rental, tournament, maintenance';
COMMENT ON COLUMN calendar_events.status IS 'Event status: confirmed, pending, cancelled, completed';
COMMENT ON COLUMN calendar_events.parent_event_id IS 'For recurring events, points to the master event';
COMMENT ON COLUMN calendar_events.is_recurring IS 'Whether this event has recurrence rules';
COMMENT ON COLUMN calendar_events.metadata IS 'JSON storage for additional event data';
