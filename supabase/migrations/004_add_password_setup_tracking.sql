-- Add field to track if user needs to set up password during onboarding
-- This is more reliable than checking password_updated_at which Supabase sets automatically

-- Add new column to club_staff table
ALTER TABLE club_staff
ADD COLUMN IF NOT EXISTS password_set_during_onboarding boolean DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN club_staff.password_set_during_onboarding IS
'Tracks if the user has explicitly set their password during the onboarding flow. This is different from password_updated_at which Supabase may set automatically.';

-- Update existing active staff to true (they already completed onboarding)
UPDATE club_staff
SET password_set_during_onboarding = true
WHERE status = 'active' AND first_login_completed = true;

-- Update existing pending staff to false (they still need to complete onboarding)
UPDATE club_staff
SET password_set_during_onboarding = false
WHERE status = 'pending' OR (status = 'active' AND first_login_completed = false);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_club_staff_onboarding_status
ON club_staff(user_id, first_login_completed, password_set_during_onboarding)
WHERE user_id IS NOT NULL;

-- Add a check constraint to ensure logical consistency
ALTER TABLE club_staff
ADD CONSTRAINT check_onboarding_logic
CHECK (
  -- If first_login_completed is true, password must be set
  (first_login_completed = true AND password_set_during_onboarding = true) OR
  -- Otherwise any combination is OK
  (first_login_completed = false)
);
