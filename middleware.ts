import { NextResponse, type NextRequest } from 'next/server'

// Protect private routes by checking the Supabase auth cookie
// Routes: /dashboard, /clientes, /productos/*, /clientes/[id]/*

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/registro',
  '/registro/unirse',
  '/registro/nuevo-club',
  '/registro/exito'
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // In development, allow all requests to avoid false redirects since
  // the client SDK stores sessions in localStorage (not visible to middleware).
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Only guard selected private prefixes
  const isPrivate = (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/productos')
  )

  if (!isPrivate) {
    return NextResponse.next()
  }

  // Supabase sets a cookie named `sb-<ref>-auth-token` (prefix varies per project).
  // As a simple heuristic, check for any cookie including `sb-` and `-auth-token`.
  const hasSupabaseAuthCookie = request.cookies.getAll().some((c) => c.name.includes('sb-') && c.name.endsWith('-auth-token'))

  if (!hasSupabaseAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clientes/:path*',
    '/productos/:path*'
  ]
}


