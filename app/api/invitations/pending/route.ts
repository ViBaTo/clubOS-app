import { NextResponse } from 'next/server'

// In mock mode, there are no pending invitations for the user to accept
export async function GET() {
  try {
    return NextResponse.json({ invitations: [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
