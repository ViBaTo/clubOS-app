import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const adminClient = getSupabaseAdminClient()
    
    // First, disable the problematic trigger temporarily
    const dropTriggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created_activate_staff ON auth.users;
    `
    
    // Create a simpler, more robust trigger
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION activate_staff_account()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Find pending staff record with matching email (case insensitive)
        UPDATE club_staff 
        SET 
            status = 'active',
            user_id = NEW.id,
            activated_at = now()
        WHERE 
            LOWER(email) = LOWER(NEW.email) 
            AND status = 'pending' 
            AND user_id IS NULL;

        -- If staff record was updated, add to organization_users (with better error handling)
        IF FOUND THEN
            INSERT INTO organization_users (organization_id, user_id, role)
            SELECT 
                cs.organization_id,
                NEW.id,
                CASE 
                    WHEN cs.role = 'gestor' THEN 'owner'
                    WHEN cs.role = 'admin' THEN 'admin'  
                    WHEN cs.role = 'profesor' THEN 'staff'
                    ELSE 'staff'
                END
            FROM club_staff cs
            WHERE LOWER(cs.email) = LOWER(NEW.email) 
            AND cs.user_id = NEW.id
            ON CONFLICT (organization_id, user_id) DO NOTHING;
        END IF;

        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error in activate_staff_account trigger: %', SQLERRM;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Recreate trigger
      CREATE TRIGGER on_auth_user_created_activate_staff
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION activate_staff_account();
    `

    // Execute the SQL commands
    const { error: dropError } = await adminClient.rpc('exec_sql', { sql: dropTriggerSQL })
    if (dropError) {
      console.log('Drop trigger warning (expected):', dropError.message)
    }

    const { error: createError } = await adminClient.rpc('exec_sql', { sql: createTriggerSQL })
    if (createError) {
      console.error('Create trigger error:', createError)
      return NextResponse.json({ 
        error: `Failed to create trigger: ${createError.message}`,
        suggestion: 'You may need to run this SQL manually in Supabase dashboard'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database trigger fixed successfully',
      action: 'Recreated activate_staff_account trigger with better error handling'
    })

  } catch (error: any) {
    console.error('Fix trigger error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}