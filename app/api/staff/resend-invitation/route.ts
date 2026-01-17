import { NextResponse } from 'next/server'
import { mockDataStore } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const member = mockDataStore.staff.find(s => s.id === id)
    if (!member) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    if (member.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only resend invitation to pending members' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully (mock)'
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
