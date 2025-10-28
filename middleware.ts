import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

// Protect private routes by checking the Supabase auth cookie
// Routes: /dashboard, /clientes, /productos/*, /clientes/[id]/*

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

  // In development, allow all requests to avoid false redirects since
  // the client SDK stores sessions in localStorage (not visible to middleware).
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Allow public paths
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Only guard selected private prefixes
  const isPrivate =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/productos')

  if (!isPrivate) {
    return NextResponse.next()
  }

  // Use server-side Supabase client to check authentication
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    // If there's any error, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/clientes/:path*', '/productos/:path*']
}
