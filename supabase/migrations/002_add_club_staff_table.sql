-- Create enum types for roles and status
DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM ('gestor', 'admin', 'profesor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_status AS ENUM ('pending', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create club_staff table
CREATE TABLE IF NOT EXISTS club_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    role staff_role NOT NULL,
    specialties text[] DEFAULT '{}',
    status staff_status DEFAULT 'pending',
    invited_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    added_by uuid REFERENCES auth.users(id),
    user_id uuid REFERENCES auth.users(id),
    first_login_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure email is unique per organization
    UNIQUE(organization_id, email)
);

-- Add RLS policies
ALTER TABLE club_staff ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view staff from their organization
CREATE POLICY "Users can view staff from their organization"
ON club_staff FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_users 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Admin/Owner users can manage staff
CREATE POLICY "Admin/Owner users can manage staff"
ON club_staff FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_users 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_club_staff_updated_at 
    BEFORE UPDATE ON club_staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to activate staff account when user signs up
CREATE OR REPLACE FUNCTION activate_staff_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Find pending staff record with matching email
    UPDATE club_staff 
    SET 
        status = 'active',
        user_id = NEW.id,
        activated_at = now()
    WHERE 
        email = NEW.email 
        AND status = 'pending' 
        AND user_id IS NULL;

    -- If staff record was found and updated, add to organization_users
    IF FOUND THEN
        INSERT INTO organization_users (organization_id, user_id, role)
        SELECT 
            organization_id,
            NEW.id,
            CASE 
                WHEN role = 'gestor' THEN 'owner'::text
                WHEN role = 'admin' THEN 'admin'::text  
                WHEN role = 'profesor' THEN 'staff'::text
            END
        FROM club_staff
        WHERE email = NEW.email AND user_id = NEW.id
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for account activation
DROP TRIGGER IF EXISTS on_auth_user_created_activate_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_staff
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION activate_staff_account();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_staff_organization_id ON club_staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_email ON club_staff(email);
CREATE INDEX IF NOT EXISTS idx_club_staff_user_id ON club_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_status ON club_staff(status);