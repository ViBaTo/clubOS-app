import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    if (error || !user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdminClient()
    const body = await request.json().catch(() => ({}))
    const { id } = body || {}

    if (id) {
      const { error: updErr } = await admin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updErr)
        return NextResponse.json({ error: updErr.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    const { error: allErr } = await admin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (allErr)
      return NextResponse.json({ error: allErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
