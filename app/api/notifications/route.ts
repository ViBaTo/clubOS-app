import { NextResponse } from 'next/server'
import { mockDataStore, mockCurrentUser } from '@/src/data/mock-data'

export async function GET() {
  try {
    // Get notifications for current user
    const userNotifications = mockDataStore.notifications
      .filter(n => n.user_id === mockCurrentUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    const unreadCount = mockDataStore.notifications
      .filter(n => n.user_id === mockCurrentUser.id && !n.read)
      .length

    // Transform to match expected format
    const items = userNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: { action_url: n.action_url },
      created_at: n.created_at,
      read_at: n.read ? n.created_at : null,
      organization_id: 'org-001'
    }))

    return NextResponse.json({
      unreadCount,
      items
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
