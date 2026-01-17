import { NextResponse } from 'next/server'
import { mockDataStore, generateStaffId } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, phone, role = 'instructor', specialties = [] } = body || {}

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'email and full_name are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = mockDataStore.staff.find(s => s.email === email)
    if (existing) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists' },
        { status: 400 }
      )
    }

    const newStaff = {
      id: generateStaffId(),
      email,
      full_name,
      phone: phone ?? null,
      role: role as 'owner' | 'admin' | 'instructor' | 'reception',
      specialties,
      status: 'pending' as const,
      organization_id: 'org-001',
      user_id: null,
      invited_at: new Date().toISOString(),
      activated_at: null,
      first_login_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockDataStore.staff.push(newStaff)

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully (mock)',
      staff: newStaff
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
