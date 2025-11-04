-- Fix the staff account activation trigger to handle email case sensitivity
-- and improve error handling

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created_activate_staff ON auth.users;

-- Recreate the function with better logic and error handling
CREATE OR REPLACE FUNCTION activate_staff_account()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_record club_staff%ROWTYPE;
BEGIN
    -- Log the activation attempt
    RAISE LOG 'Attempting to activate staff account for email: %', NEW.email;

    -- Find and update pending staff record with case-insensitive email match
    UPDATE club_staff
    SET
        status = 'active',
        user_id = NEW.id,
        activated_at = now()
    WHERE
        LOWER(email) = LOWER(NEW.email)
        AND status = 'pending'
        AND user_id IS NULL
    RETURNING * INTO v_staff_record;

    -- If staff record was found and updated
    IF FOUND THEN
        RAISE LOG 'Staff record activated for %: org_id=%, role=%',
            NEW.email, v_staff_record.organization_id, v_staff_record.role;

        -- Add to organization_users table
        INSERT INTO organization_users (organization_id, user_id, role)
        VALUES (
            v_staff_record.organization_id,
            NEW.id,
            CASE
                WHEN v_staff_record.role = 'gestor' THEN 'owner'::text
                WHEN v_staff_record.role = 'admin' THEN 'admin'::text
                WHEN v_staff_record.role = 'profesor' THEN 'staff'::text
                ELSE 'staff'::text
            END
        )
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        RAISE LOG 'Staff member % added to organization_users', NEW.email;
    ELSE
        RAISE LOG 'No pending staff record found for email: %', NEW.email;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error in activate_staff_account for %: % - %',
            NEW.email, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_activate_staff
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION activate_staff_account();

-- Update any existing staff records to ensure email consistency
UPDATE club_staff
SET email = LOWER(email)
WHERE email != LOWER(email);
