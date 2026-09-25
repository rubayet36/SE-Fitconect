'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, PauseCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'

function SuspendedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const reason = searchParams.get('reason') === 'paused' ? 'paused' : 'blocked'

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
    router.refresh()
  }

  const isPaused = reason === 'paused'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isPaused ? 'bg-amber-500/15' : 'bg-red-600/15'
          }`}
        />

        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl border ${
            isPaused
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-red-500/10 text-red-500 border-red-500/30'
          }`}
        >
          {isPaused ? <PauseCircle size={44} /> : <ShieldAlert size={44} />}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span
            className={`inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              isPaused
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-600/20 text-red-400'
            }`}
          >
            {isPaused ? 'Membership Paused' : 'Account Suspended'}
          </span>
          <h1 className="text-2xl font-black text-white">
            {isPaused ? 'Access Currently Paused' : 'Account Blocked'}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {isPaused
              ? 'Your gym account access has been temporarily paused by gym administration. Please contact the front desk or gym owner to unpause your membership.'
              : 'Your account access has been suspended by gym management. If you believe this is in error, please contact the gym administrator directly.'}
          </p>
        </div>

        {/* Gym Help Banner */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 text-left space-y-1">
          <p className="font-bold text-white uppercase tracking-wider text-[10px]">
            Need Assistance?
          </p>
          <p>Visit the gym reception desk or reach out to the gym owner to reactivate your profile.</p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={16} /> Sign Out of Account
        </button>
      </div>
    </div>
  )
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SuspendedContent />
    </Suspense>
  )
}
