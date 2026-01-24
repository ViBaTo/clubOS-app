import { NextResponse } from 'next/server'
import { mockOrganization } from '@/src/data/mock-data'

export async function GET() {
  try {
    return NextResponse.json({
      organization: mockOrganization
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug } = body || {}

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: `org-${Date.now()}`,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        access_code: 'MOCK' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        created_at: new Date().toISOString()
      }
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
