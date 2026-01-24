import { NextResponse } from 'next/server'
import { mockOrganization } from '@/src/data/mock-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body || {}

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    // Accept the mock organization code or "DEMO2024"
    if (code === mockOrganization.access_code || code === 'DEMO2024') {
      return NextResponse.json({
        valid: true,
        organization: {
          id: mockOrganization.id,
          name: mockOrganization.name
        }
      })
    }

    return NextResponse.json({
      valid: false,
      error: 'Invalid access code'
    }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
