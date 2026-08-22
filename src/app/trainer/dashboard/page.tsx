import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default async function TrainerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, membersRes, requestsRes, dietRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('profiles').select('id, full_name, email, user_id_code').eq('role', 'member'),
    supabase.from('requests').select('*').in('request_type', ['diet', 'both']).neq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('diet_plans').select('id, member_id').eq('trainer_id', user!.id),
  ])

  const profile = profileRes.data as any
  const members = (membersRes.data || []) as any[]
  const pendingRequests = (requestsRes.data || []) as any[]
  const dietPlans = (dietRes.data || []) as any[]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-red-500 font-bold uppercase tracking-widest">Trainer HQ</p>
          <h1 className="text-3xl font-black text-white mt-1">
            Welcome back, {profile?.full_name || 'Coach'} 🔥
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage your member workout routines, AI nutrition charts, and client progress.
          </p>
        </div>

        <Link
          href="/trainer/diet-generator"
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles size={16} />
          Open AI Diet Generator
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Members', value: members.length, icon: '👥', color: 'blue' },
          { label: 'Pending Requests', value: pendingRequests.length, icon: '📋', color: 'red' },
          { label: 'Assigned Diet Plans', value: dietPlans.length, icon: '🥗', color: 'green' },
          { label: 'Trainer Status', value: 'Active', icon: '⚡', color: 'yellow' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-red-800/40 transition-colors">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Requests & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-6 h-[2px] bg-red-600" /> Pending Diet & Workout Requests
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">
              {pendingRequests.length} Waiting
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <p className="text-white font-bold text-sm">All caught up!</p>
              <p className="text-zinc-500 text-xs">No pending diet or workout plan requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req: any) => {
                const member = members.find((m) => m.id === req.member_id)
                return (
                  <div
                    key={req.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{member?.full_name || 'Member'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase font-mono">
                          {req.request_type}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs">{member?.email}</p>
                      {req.notes && (
                        <p className="text-zinc-400 text-xs italic bg-zinc-900/60 p-2 rounded-lg mt-1.5 border border-zinc-800/60">
                          &quot;{req.notes}&quot;
                        </p>
                      )}
                    </div>

                    <Link
                      href="/trainer/diet-generator"
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Sparkles size={14} /> Generate Plan <ArrowRight size={13} />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Nav Links */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <span className="w-4 h-[2px] bg-red-600" /> Trainer Tools
          </h2>

          <div className="space-y-3">
            <Link
              href="/trainer/diet-generator"
              className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-600/50 hover:bg-red-950/10 transition-all block group"
            >
              <div className="text-2xl mb-1">🥣</div>
              <p className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">
                AI Diet Generator
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Calculate TDEE, macros, and generate 5-meal daily schedules.
              </p>
            </Link>

            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="text-2xl mb-1">🏋️</div>
              <p className="font-bold text-zinc-300 text-sm">
                Workout Builder
              </p>
              <p className="text-zinc-600 text-xs mt-0.5">
                Assign day-by-day routines and exercises.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
