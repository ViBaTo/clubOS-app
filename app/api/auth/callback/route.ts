import { NextResponse } from 'next/server'

// In mock mode, auth callback just redirects to dashboard
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') || '/dashboard'
  
  return NextResponse.redirect(new URL(next, request.url))
}
