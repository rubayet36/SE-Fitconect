import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Where to redirect after login — defaults to /member/dashboard
  const next = searchParams.get('next') ?? '/member/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check the user's role and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role =
          profile?.role ||
          (user.email === 'admin@vortex.com' || user.email === 'vortexfitnessclub001@gmail.com'
            ? 'owner'
            : (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || 'member')

        const dest =
          role === 'owner'
            ? '/owner/dashboard'
            : role === 'trainer'
            ? '/trainer/dashboard'
            : '/member/dashboard'

        return NextResponse.redirect(`${origin}${dest}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
