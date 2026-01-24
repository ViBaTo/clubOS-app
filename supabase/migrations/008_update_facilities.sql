-- Migration 008: Add location_type field to facilities table

-- Add location_type field for facility location classification
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS location_type varchar(20) DEFAULT 'interior';

-- Add constraint for location_type values
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_location_type_check;
ALTER TABLE facilities ADD CONSTRAINT facilities_location_type_check 
  CHECK (location_type IN ('interior', 'exterior', 'multiuso'));

-- Add comments for documentation
COMMENT ON COLUMN facilities.location_type IS 'Physical location type: interior, exterior, or multiuso (multi-purpose)';
