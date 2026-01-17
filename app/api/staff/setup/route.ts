import { NextResponse } from 'next/server'

// This endpoint is for new staff completing their account setup
// In mock mode, we just return success
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body || {}

    if (!password) {
      return NextResponse.json({ error: 'password is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Account setup completed (mock)'
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
