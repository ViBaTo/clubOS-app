import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const adminClient = getSupabaseAdminClient()
    
    // Add missing column if it doesn't exist
    const addColumnSQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='club_staff' AND column_name='first_login_completed'
        ) THEN
          ALTER TABLE club_staff ADD COLUMN first_login_completed boolean DEFAULT false;
        END IF;
      END $$;
    `

    const { data, error } = await adminClient.rpc('exec_sql', { 
      sql: addColumnSQL 
    })

    if (error) {
      console.error('Database fix error:', error)
      return NextResponse.json({ 
        error: `Database fix failed: ${error.message}`,
        suggestion: 'You may need to add the column manually in Supabase dashboard'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      action: 'Added first_login_completed column if missing'
    })

  } catch (error: any) {
    console.error('Fix database error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error',
      suggestion: 'Try running the full migration SQL in Supabase dashboard'
    }, { status: 500 })
  }
}