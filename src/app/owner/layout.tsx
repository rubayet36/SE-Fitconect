import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNavbar } from '@/components/AppNavbar'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single() as any

  const isOwner =
    profile?.role === 'owner' ||
    user.email === 'admin@vortex.com' ||
    user.email === 'vortexfitnessclub001@gmail.com' ||
    user.user_metadata?.role === 'owner' ||
    user.app_metadata?.role === 'owner'

  if (!isOwner) {
    if (profile?.role === 'trainer') redirect('/trainer/dashboard')
    redirect('/member/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-black">
      <AppNavbar role="owner" userName={profile?.full_name || user.email || ''} />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
