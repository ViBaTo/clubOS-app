import { NextResponse } from 'next/server'
import { mockDataStore, mockCurrentUser } from '@/src/data/mock-data'

export async function POST() {
  try {
    // Mark all notifications as read for current user
    mockDataStore.notifications.forEach(n => {
      if (n.user_id === mockCurrentUser.id) {
        n.read = true
      }
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
