'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BadgeCheck, X } from 'lucide-react'

export function MemberIdGate() {
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const [memberIdCode, setMemberIdCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id_code, full_name')
        .eq('id', user.id)
        .single()

      if (!profile?.user_id_code) {
        setFullName(profile?.full_name || '')
        setShow(true)
      }
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!memberIdCode.trim()) {
      toast.error('Please enter your Gym Member ID')
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        user_id_code: memberIdCode.trim().toUpperCase(),
        full_name: fullName.trim() || undefined,
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome to Vortex! 🔥')
    setShow(false)
  }

  if (!show) return null

  return (
    // Backdrop — non-dismissable
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-700/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 mx-auto mb-5">
          <BadgeCheck size={26} className="text-red-500" />
        </div>

        <h2 className="text-xl font-black text-white text-center">Complete Your Profile</h2>
        <p className="text-zinc-500 text-sm text-center mt-1.5 mb-6">
          Your gym needs your <span className="text-white font-semibold">Member ID</span> to link your account. Ask the front desk if you don&apos;t know it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 tracking-widest uppercase">
              Your Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
            />
          </div>

          {/* Member ID */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 tracking-widest uppercase">
              Gym Member ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={memberIdCode}
              onChange={e => setMemberIdCode(e.target.value)}
              placeholder="e.g. VFC-001"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm tracking-widest uppercase"
            />
            <p className="text-zinc-600 text-xs mt-1.5">Ask your trainer or the gym desk</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold tracking-widest text-sm uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
