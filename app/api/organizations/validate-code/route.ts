import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const { accessCode } = await request.json()

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      )
    }

    // Validate access code format (6-8 characters, alphanumeric)
    const codeRegex = /^[A-Z0-9]{6,8}$/
    if (!codeRegex.test(accessCode.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid access code format' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()
    
    // Check if organization exists with this access code
    const { data: organization, error } = await admin
      .from('organizations')
      .select('id, name, club_type, status, access_code')
      .eq('access_code', accessCode.toUpperCase())
      .eq('status', 'active')
      .single()

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Club not found or inactive' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      organization: {
        id: organization.id,
        name: organization.name,
        clubType: organization.club_type,
        accessCode: organization.access_code
      }
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}