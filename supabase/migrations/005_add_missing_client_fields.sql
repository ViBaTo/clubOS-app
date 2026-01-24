-- Migration 005: Add missing fields to clients table
-- Adds: avatar_url, date_of_birth, address, emergency_contact, preferred_instructor_id, habitual_schedule, rating

-- Avatar URL for client profile picture
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Date of birth
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Address
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address text;

-- Emergency contact information
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact text;

-- Preferred instructor (FK to club_staff)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_instructor_id uuid REFERENCES club_staff(id) ON DELETE SET NULL;

-- Habitual schedule (JSON object with days and times)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS habitual_schedule jsonb DEFAULT '{}';

-- Client rating (0-5 scale)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rating numeric(2,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Add index for preferred instructor lookups
CREATE INDEX IF NOT EXISTS idx_clients_preferred_instructor ON clients(preferred_instructor_id);

-- Add comment for documentation
COMMENT ON COLUMN clients.avatar_url IS 'URL to client profile picture in storage';
COMMENT ON COLUMN clients.date_of_birth IS 'Client date of birth';
COMMENT ON COLUMN clients.address IS 'Client physical address';
COMMENT ON COLUMN clients.emergency_contact IS 'Emergency contact name and phone';
COMMENT ON COLUMN clients.preferred_instructor_id IS 'FK to club_staff - preferred instructor';
COMMENT ON COLUMN clients.habitual_schedule IS 'JSON with preferred days/times for classes';
COMMENT ON COLUMN clients.rating IS 'Client rating from 0 to 5';
