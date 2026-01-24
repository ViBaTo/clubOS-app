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

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { notificationId, notificationIds, markAllAsRead = false } = body

    const admin = getSupabaseAdminClient()
    const currentTime = new Date().toISOString()

    // Mark all notifications as read
    if (markAllAsRead) {
      const { error: updateError } = await admin
        .from('notifications')
        .update({ read_at: currentTime })
        .eq('user_id', user.id)
        .is('read_at', null)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    // Mark specific notification as read
    if (notificationId) {
      const { error: updateError } = await admin
        .from('notifications')
        .update({ read_at: currentTime })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .is('read_at', null)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    }

    // Mark multiple notifications as read
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      const { error: updateError } = await admin
        .from('notifications')
        .update({ read_at: currentTime })
        .in('id', notificationIds)
        .eq('user_id', user.id)
        .is('read_at', null)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notifications marked as read`
      })
    }

    return NextResponse.json(
      { error: 'No notifications specified to mark as read' },
      { status: 400 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId, markAsUnread = false } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()

    if (markAsUnread) {
      // Mark as unread (set read_at to null)
      const { error: updateError } = await admin
        .from('notifications')
        .update({ read_at: null })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marked as unread'
      })
    } else {
      // Mark as read
      const { error: updateError } = await admin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}