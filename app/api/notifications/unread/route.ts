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

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdminClient()

    // Get unread notification count for the user
    const { count: unreadCount, error: countError } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      unreadCount: unreadCount ?? 0
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { types } = await request.json()

    const admin = getSupabaseAdminClient()

    let query = admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    // Filter by notification types if provided
    if (types && Array.isArray(types) && types.length > 0) {
      query = query.in('type', types)
    }

    const { count: unreadCount, error: countError } = await query

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      unreadCount: unreadCount ?? 0,
      types: types || null
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}