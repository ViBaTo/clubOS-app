import { NextResponse } from 'next/server'
import { mockDataStore } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const memberIndex = mockDataStore.staff.findIndex(s => s.id === id)
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    mockDataStore.staff[memberIndex] = {
      ...mockDataStore.staff[memberIndex],
      status: 'inactive',
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member deactivated',
      staff: mockDataStore.staff[memberIndex]
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
