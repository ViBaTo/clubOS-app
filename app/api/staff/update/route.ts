import { NextResponse } from 'next/server'
import { mockDataStore } from '@/src/data/mock-data'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const memberIndex = mockDataStore.staff.findIndex(s => s.id === id)
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const updatableFields = ['full_name', 'phone', 'role', 'specialties']
    const payload: Record<string, any> = {}

    for (const key of updatableFields) {
      if (key in updates) payload[key] = updates[key]
    }

    mockDataStore.staff[memberIndex] = {
      ...mockDataStore.staff[memberIndex],
      ...payload,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      staff: mockDataStore.staff[memberIndex]
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
