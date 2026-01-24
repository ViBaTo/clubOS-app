import { NextResponse } from 'next/server'
import { mockDataStore, mockCurrentUser } from '@/src/data/mock-data'

export async function GET() {
  try {
    const unreadCount = mockDataStore.notifications
      .filter(n => n.user_id === mockCurrentUser.id && !n.read)
      .length

    return NextResponse.json({ unreadCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
