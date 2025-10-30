-- Migration 001: Add access_code field and RLS policies for invitation system
-- Created: 2025-01-29
-- Description: Adds access_code field to organizations table and ensures proper RLS policies

-- 1. Add access_code column to organizations table (if not exists)
-- Note: Currently using 'slug' field, but adding 'access_code' for clarity and future separation
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(8) UNIQUE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_access_code ON organizations(access_code);

-- 3. Generate access codes for existing organizations that don't have them
-- Use slug value as access_code for existing organizations
UPDATE organizations 
SET access_code = slug
WHERE access_code IS NULL AND slug IS NOT NULL;

-- For organizations without slug, generate new codes
UPDATE organizations 
SET access_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 8))
WHERE access_code IS NULL;

-- 4. Ensure RLS is enabled on required tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- 5. Create/update RLS policies for notifications
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications (admin client)
CREATE POLICY "System can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create/update RLS policies for invitations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Org admins can view invitations" ON invitations;
DROP POLICY IF EXISTS "System can insert invitations" ON invitations;
DROP POLICY IF EXISTS "Org admins can update invitations" ON invitations;

-- Organization admins can view pending invitations for their organization
CREATE POLICY "Org admins can view invitations" ON invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = invitations.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role IN ('owner', 'admin')
  )
);

-- System can insert invitations (admin client)
CREATE POLICY "System can insert invitations" ON invitations
FOR INSERT WITH CHECK (true);

-- Organization admins can update invitations (approve/reject)
CREATE POLICY "Org admins can update invitations" ON invitations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = invitations.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role IN ('owner', 'admin')
  )
);

-- 7. Create/update RLS policies for organization_users
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view org memberships" ON organization_users;
DROP POLICY IF EXISTS "System can insert org memberships" ON organization_users;

-- Users can view memberships for organizations they belong to
CREATE POLICY "Users can view org memberships" ON organization_users
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.organization_id = organization_users.organization_id
    AND ou.user_id = auth.uid()
    AND ou.role IN ('owner', 'admin')
  )
);

-- System can insert organization memberships (admin client)
CREATE POLICY "System can insert org memberships" ON organization_users
FOR INSERT WITH CHECK (true);

-- 8. Add helpful comments
COMMENT ON COLUMN organizations.access_code IS 'Public access code for joining organization (8 characters, unique)';
COMMENT ON COLUMN organizations.slug IS 'Internal slug for organization identification (may be same as access_code)';

-- 9. Create function to generate unique access codes (for future use)
CREATE OR REPLACE FUNCTION generate_unique_access_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  new_code VARCHAR(8);
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 1, 8));
    
    -- Check if it's unique
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE access_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique access code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-generate access codes for new organizations
CREATE OR REPLACE FUNCTION set_access_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL THEN
    NEW.access_code := generate_unique_access_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_access_code ON organizations;
CREATE TRIGGER trigger_set_access_code
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_access_code_on_insert();

-- Migration complete