import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNavbar } from '@/components/AppNavbar'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, status')
    .eq('id', user.id)
    .single() as any

  const role =
    profile?.role ||
    (user.email === 'admin@vortex.com' || user.email === 'vortexfitnessclub001@gmail.com'
      ? 'owner'
      : (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || 'member')

  // Access control check: Blocked or Paused accounts cannot access member area
  if (profile?.status === 'blocked') redirect('/suspended?reason=blocked')
  if (profile?.status === 'paused') redirect('/suspended?reason=paused')

  if (role === 'owner') redirect('/owner/dashboard')
  if (role === 'trainer') redirect('/trainer/dashboard')

  return (
    <div className="flex min-h-screen bg-black" suppressHydrationWarning>
      <AppNavbar role="member" userName={profile?.full_name || user.email || ''} />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}
