-- Migration 010: Create event_participants table
-- Links clients to calendar events (for group classes, academies, etc.)

-- Create participation_status enum
DO $$ BEGIN
  CREATE TYPE participation_status AS ENUM ('registered', 'attended', 'no_show', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status participation_status DEFAULT 'registered',
  registered_at timestamptz DEFAULT now(),
  attended_at timestamptz,
  product_sale_id uuid REFERENCES product_sales(id) ON DELETE SET NULL,
  notes text,
  
  UNIQUE(event_id, client_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_client ON event_participants(client_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_sale ON event_participants(product_sale_id);

-- Add comments for documentation
COMMENT ON TABLE event_participants IS 'Links clients to calendar events as participants';
COMMENT ON COLUMN event_participants.status IS 'Participation status: registered, attended, no_show, cancelled';
COMMENT ON COLUMN event_participants.product_sale_id IS 'Reference to product_sale if class was consumed from a package';
COMMENT ON COLUMN event_participants.attended_at IS 'Timestamp when attendance was recorded';
