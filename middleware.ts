import { NextResponse, type NextRequest } from 'next/server'

// ============================================================================
// MOCK MIDDLEWARE FOR DEV BRANCH
// In dev mode with mockdata, we skip authentication checks
// ============================================================================

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/login/reset',
  '/registro',
  '/registro/unirse',
  '/registro/nuevo-club',
  '/registro/exito'
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static files
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // In mock mode, allow all authenticated routes
  // The app will use mockCurrentUser for authentication state
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/clientes/:path*', '/productos/:path*', '/calendario/:path*', '/settings/:path*']
}
