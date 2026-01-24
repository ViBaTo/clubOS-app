import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    if (error || !user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdminClient()

    const { data: items } = await admin
      .from('notifications')
      .select(
        'id, type, title, message, data, created_at, read_at, organization_id'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { count: unreadCount } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    return NextResponse.json({
      unreadCount: unreadCount ?? 0,
      items: items ?? []
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
