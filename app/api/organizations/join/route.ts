import { NextResponse } from 'next/server'
import { mockOrganization } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body || {}

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    // Accept the mock organization code
    if (code === mockOrganization.access_code || code === 'DEMO2024') {
      return NextResponse.json({
        success: true,
        message: 'Joined organization successfully (mock)',
        organization: mockOrganization
      })
    }

    return NextResponse.json({ error: 'Invalid access code' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
