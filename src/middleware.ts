import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes: redirect if not logged in
  if (!user && (
    pathname.startsWith('/member') ||
    pathname.startsWith('/trainer') ||
    pathname.startsWith('/owner') ||
    pathname.startsWith('/setup-profile')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Cross-role protection and routing when logged in
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const role =
      profile?.role ||
      (user.email === 'admin@vortex.com' || user.email === 'vortexfitnessclub001@gmail.com'
        ? 'owner'
        : (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || 'member')

    // Suspension check
    if (profile?.status === 'blocked') {
      return NextResponse.redirect(new URL('/suspended?reason=blocked', request.url))
    }
    if (profile?.status === 'paused') {
      return NextResponse.redirect(new URL('/suspended?reason=paused', request.url))
    }

    // Auth routes: redirect to respective dashboard
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
      let redirectTo = '/member/dashboard'
      if (role === 'trainer') redirectTo = '/trainer/dashboard'
      else if (role === 'owner') redirectTo = '/owner/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Role-based boundaries
    if (role === 'owner' && pathname.startsWith('/member')) {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url))
    }
    if (role === 'trainer' && pathname.startsWith('/member')) {
      return NextResponse.redirect(new URL('/trainer/dashboard', request.url))
    }
    if (role === 'member' && (pathname.startsWith('/owner') || pathname.startsWith('/trainer'))) {
      return NextResponse.redirect(new URL('/member/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/setup-profile',
    '/auth/callback',
    '/member/:path*',
    '/trainer/:path*',
    '/owner/:path*',
  ],
}
