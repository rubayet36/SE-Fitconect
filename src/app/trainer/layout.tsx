import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNavbar } from '@/components/AppNavbar'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single() as any

  if (profile?.role === 'member') redirect('/member/dashboard')

  return (
    <div className="flex min-h-screen bg-black">
      <AppNavbar role="trainer" userName={profile?.full_name || user.email || ''} />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
