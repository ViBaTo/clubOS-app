import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body || {}

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation created (mock)',
      invitation: {
        id: `inv-${Date.now()}`,
        email,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
