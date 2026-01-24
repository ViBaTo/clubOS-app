import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user: sessionUser }
    } = await supabase.auth.getUser()

    const {
      clubCode,
      role = 'member',
      message,
      userEmail,
      userId
    } = await request.json()
    if (!clubCode)
      return NextResponse.json({ error: 'clubCode required' }, { status: 400 })

    let user = sessionUser
    if (!user && process.env.NODE_ENV === 'development') {
      const admin = getSupabaseAdminClient()
      if (userId) {
        const { data: found } = await admin.auth.admin.getUserById(userId)
        user = found?.user ?? null
      } else if (userEmail) {
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
    }
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve organization by slug/code
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug, name')
      .eq('slug', clubCode.toUpperCase())
      .single()

    if (orgError || !org)
      return NextResponse.json(
        { error: 'Club code not found' },
        { status: 404 }
      )

    // Insert membership; if you prefer invitations, this would create an invitation instead
    const writer = getSupabaseAdminClient()
    const { error: linkError } = await writer
      .from('organization_users')
      .insert({ organization_id: org.id, user_id: user.id, role })

    if (linkError)
      return NextResponse.json({ error: linkError.message }, { status: 400 })

    // Create notifications for organization admins/owners
    try {
      const { data: admins } = await writer
        .from('organization_users')
        .select('user_id, role')
        .eq('organization_id', org.id)
        .in('role', ['owner', 'admin'])

      const applicantEmail = user.email ?? 'usuario'
      const title = 'Nueva solicitud de acceso al club'
      const notifMessage = `${applicantEmail} solicitó unirse a ${org.name}${
        role ? ` como ${role}` : ''
      }${message ? `: ${message}` : ''}`

      if (admins && admins.length > 0) {
        const rows = admins.map((a) => ({
          user_id: a.user_id,
          organization_id: org.id,
          type: 'join_request',
          title,
          message: notifMessage,
          data: {
            applicant_id: user.id,
            applicant_email: applicantEmail,
            organization_id: org.id,
            role_requested: role,
            message
          }
        }))
        await writer.from('notifications').insert(rows as any)
      }
    } catch (_) {
      // Best-effort notifications; ignore failures
    }

    return NextResponse.json({ ok: true, organization: org })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
