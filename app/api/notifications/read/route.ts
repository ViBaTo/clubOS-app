import { NextResponse } from 'next/server'
import { mockDataStore } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const notifIndex = mockDataStore.notifications.findIndex(n => n.id === id)
    if (notifIndex !== -1) {
      mockDataStore.notifications[notifIndex].read = true
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
