import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'

// Generate an 8-character alphanumeric slug (UPPERCASE) and ensure it's unique
async function generateUniqueSlug(writer: any): Promise<string> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 8
  const maxAttempts = 20

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let candidate = ''
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * alphabet.length)
      candidate += alphabet[idx]
    }

    const { count } = await writer
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidate)

    if (!count) return candidate
  }

  throw new Error('No se pudo generar un código único para el club')
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)

    const body = await request.json()
    const authRes = await supabase.auth.getUser()
    let user = authRes.data.user

    // Dev fallback: allow creating org if no session (email confirmation pending)
    if (!user && process.env.NODE_ENV === 'development') {
      const admin = getSupabaseAdminClient()
      const { userId, userEmail } = body || {}
      if (userId) {
        const { data: found } = await admin.auth.admin.getUserById(userId)
        user = found?.user ?? null
      } else if (userEmail) {
        // Fallback: list first page and find by email (dev only)
        const { data: list } = (await admin.auth.admin.listUsers({
          page: 1,
          perPage: 100
        })) as any
        user =
          list?.users?.find(
            (u: any) =>
              u.email?.toLowerCase() === String(userEmail).toLowerCase()
          ) ?? null
      }
      if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { clubType, clubName, address, phone, clubEmail, cif } = body

    // Use admin client for writes to bypass RLS (org insert + membership link)
    const writer = getSupabaseAdminClient()

    // Generate unique slug code for the organization
    const slugCode = await generateUniqueSlug(writer)

    // Insert organization
    const { data: org, error: orgError } = await writer
      .from('organizations')
      .insert({
        name: clubName,
        slug: slugCode,
        club_type: clubType || 'multideportivo',
        status: 'active',
        settings: { address, phone, clubEmail, cif }
      })
      .select('*')
      .single()

    if (orgError)
      return NextResponse.json({ error: orgError.message }, { status: 400 })

    // Link current user as owner
    const { error: linkError } = await writer
      .from('organization_users')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        is_primary: true
      })

    if (linkError)
      return NextResponse.json({ error: linkError.message }, { status: 400 })

    return NextResponse.json({ organization: org })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
