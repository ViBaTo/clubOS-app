-- Ensure activate_staff_account handles both initial insert and later confirmation updates
CREATE OR REPLACE FUNCTION activate_staff_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Match pending staff records by email (case insensitive)
    UPDATE public.club_staff
    SET
        status = 'active',
        user_id = NEW.id,
        activated_at = now()
    WHERE
        LOWER(public.club_staff.email) = LOWER(NEW.email)
        AND public.club_staff.status = 'pending'
        AND public.club_staff.user_id IS NULL;

    IF FOUND THEN
        INSERT INTO public.organization_users (organization_id, user_id, role)
        SELECT
            public.club_staff.organization_id,
            NEW.id,
            (CASE
                WHEN public.club_staff.role = 'gestor' THEN 'owner'
                WHEN public.club_staff.role = 'admin' THEN 'admin'
                WHEN public.club_staff.role = 'profesor' THEN 'staff'
                ELSE 'staff'
            END)::public.org_role
        FROM public.club_staff
        WHERE LOWER(public.club_staff.email) = LOWER(NEW.email)
            AND public.club_staff.user_id = NEW.id
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate existing trigger for clarity
DROP TRIGGER IF EXISTS on_auth_user_created_activate_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_staff
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION activate_staff_account();

-- New trigger to catch invite confirmations that happen via UPDATE
DROP TRIGGER IF EXISTS on_auth_user_confirmed_activate_staff ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_activate_staff
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (
        NEW.email_confirmed_at IS NOT NULL
        AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    )
    EXECUTE FUNCTION activate_staff_account();

