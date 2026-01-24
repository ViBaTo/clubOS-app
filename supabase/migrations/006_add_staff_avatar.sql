-- Migration 006: Add avatar field to club_staff table

-- Avatar URL for staff profile picture
ALTER TABLE club_staff ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comment for documentation
COMMENT ON COLUMN club_staff.avatar_url IS 'URL to staff profile picture in storage';
