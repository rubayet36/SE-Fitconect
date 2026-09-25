import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles, ArrowRight, Zap, CheckCircle2, ChevronRight } from 'lucide-react'

export default async function TrainerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, membersRes, requestsRes, dietRes, pendingLogsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('profiles').select('id, full_name, email, user_id_code').eq('role', 'member'),
    supabase.from('requests').select('*').in('request_type', ['diet', 'both']).neq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('diet_plans').select('id, member_id').eq('trainer_id', user!.id),
    supabase.from('exercise_logs').select('id', { count: 'exact', head: true }).eq('trainer_id', user!.id).eq('status', 'pending'),
  ])

  const profile = profileRes.data as any
  const members = (membersRes.data || []) as any[]
  const pendingRequests = (requestsRes.data || []) as any[]
  const dietPlans = (dietRes.data || []) as any[]
  const pendingLogsCount = pendingLogsRes.count || 0

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
            Manage your member workout routines, exercise verifications, and nutrition plans.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <Link
            href="/trainer/approvals"
            className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-zinc-700/60 flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-green-400" />
            Approvals Queue
            {pendingLogsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono">
                {pendingLogsCount}
              </span>
            )}
          </Link>
          <Link
            href="/trainer/diet-generator"
            className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center gap-2"
          >
            <Sparkles size={16} />
            AI Diet Generator
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Members', value: members.length, icon: '👥', color: 'blue' },
          { label: 'Workout Approvals', value: pendingLogsCount, icon: '⚡', color: 'yellow', highlight: pendingLogsCount > 0 },
          { label: 'Diet Requests', value: pendingRequests.length, icon: '📋', color: 'red', highlight: pendingRequests.length > 0 },
          { label: 'Assigned Diet Plans', value: dietPlans.length, icon: '🥗', color: 'green' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-zinc-950 border rounded-xl p-4 transition-colors ${
              stat.highlight
                ? 'border-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Workout Approvals Banner if pending */}
      {pendingLogsCount > 0 && (
        <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 border border-red-800/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-red-600/20 text-red-400 rounded-xl text-xl">⚡</span>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pendingLogsCount} Member Workout{pendingLogsCount === 1 ? '' : 's'} Awaiting Verification
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review submitted sets and reps to award member gamification points and keep their streaks alive.
              </p>
            </div>
          </div>
          <Link
            href="/trainer/approvals"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            Open Queue <ArrowRight size={14} />
          </Link>
        </div>
      )}

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
              href="/trainer/approvals"
              className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-600/50 hover:bg-red-950/10 transition-all block group"
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">
                  Exercise Approvals
                </p>
                {pendingLogsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold">
                    {pendingLogsCount}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Verify member workouts and grant gamification points.
              </p>
            </Link>

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

            <Link
              href="/trainer/workout-builder"
              className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-600/50 hover:bg-red-950/10 transition-all block group"
            >
              <div className="text-2xl mb-1">🏋️</div>
              <p className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">
                Workout Builder
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Assign day-by-day routines and exercises.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
