import { NextResponse } from 'next/server'
import { mockDataStore, mockOrganization, mockCurrentUser } from '@/src/data/mock-data'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const member = mockDataStore.staff.find(s => s.id === id)

    if (!member) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      staff: {
        ...member,
        organization: {
          id: mockOrganization.id,
          name: mockOrganization.name,
          slug: mockOrganization.slug
        },
        has_account: !!member.user_id,
        is_self: member.user_id === mockCurrentUser.id,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const memberIndex = mockDataStore.staff.findIndex(s => s.id === id)

    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    mockDataStore.staff.splice(memberIndex, 1)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
