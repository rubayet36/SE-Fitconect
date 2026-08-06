'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BadgeCheck, IdCard, User, Zap } from 'lucide-react'

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [memberIdCode, setMemberIdCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Pre-fill full name from the profile (Google sends it)
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, user_id_code, role')
        .eq('id', user.id)
        .single()

      // If they already have a user_id_code, skip this page
      if (profile?.user_id_code) {
        const dest =
          profile.role === 'owner'
            ? '/owner/dashboard'
            : profile.role === 'trainer'
            ? '/trainer/dashboard'
            : '/member/dashboard'
        router.replace(dest)
        return
      }

      if (profile?.full_name) setFullName(profile.full_name)
      setInitialLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!memberIdCode.trim()) {
      toast.error('Please enter your Gym Member ID')
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        user_id_code: memberIdCode.trim().toUpperCase(),
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Profile set up! Welcome to Vortex 🔥')
    setTimeout(() => {
      router.push('/member/dashboard')
      router.refresh()
    }, 1200)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background glows */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-red-950/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/30 mb-4">
            <IdCard size={28} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Complete Your Profile
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            One last step before accessing your dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Gym Member ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">
                Gym Member ID
              </label>
              <div className="relative">
                <BadgeCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  required
                  value={memberIdCode}
                  onChange={e => setMemberIdCode(e.target.value)}
                  placeholder="e.g. VFC-001"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm tracking-widest uppercase"
                />
              </div>
              <p className="text-zinc-600 text-xs mt-1.5">
                Ask your trainer or the gym desk for your Member ID
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold tracking-widest text-sm uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Zap size={16} /> Enter Vortex</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
