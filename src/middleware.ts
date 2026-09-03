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

  // Auth routes: redirect if already logged in
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let redirectTo = '/member/dashboard'
    if (profile?.role === 'trainer') redirectTo = '/trainer/diet-generator'
    else if (profile?.role === 'owner') redirectTo = '/owner/dashboard'

    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Protected routes: redirect if not logged in
  if (!user && (
    pathname.startsWith('/member') ||
    pathname.startsWith('/trainer') ||
    pathname.startsWith('/owner') ||
    pathname.startsWith('/setup-profile')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
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
