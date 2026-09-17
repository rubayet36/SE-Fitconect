import { createClient } from '@/lib/supabase/server'
import { PushOptIn } from '@/components/PushOptIn'
import { MemberIdGate } from '@/components/MemberIdGate'
import { DashboardHeader } from '@/components/DashboardHeader'
import Link from 'next/link'
import { Zap, ArrowRight, Flame, Trophy, Award } from 'lucide-react'

function PointsWidget({
  totalPoints,
  streak,
  rank,
  weeklyPoints,
  badges,
}: {
  totalPoints: number
  streak: number
  rank: number
  weeklyPoints: number
  badges: { icon_emoji: string; name: string; description?: string }[]
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-xl group">
      {/* Subtle glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-red-600/10 transition-all" />
      
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          My Gamification & Points
        </h3>
        <div className="flex items-center gap-2">
          <Link
            href="/member/log-exercise"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1"
          >
            ⚡ Log Workout
          </Link>
          <Link
            href="/member/leaderboard"
            className="text-xs font-bold text-red-400 hover:text-red-300 hidden sm:flex items-center gap-1 transition-colors px-2 py-1"
          >
            Leaderboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Total Points */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Points</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black text-amber-400 tracking-tight">{totalPoints.toLocaleString()}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase">pts</span>
          </div>
          <span className="text-[10px] text-zinc-400">+{weeklyPoints} this week</span>
        </div>

        {/* Streak */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Workout Streak</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black text-orange-400 tracking-tight">{streak}</span>
            <span className="text-xs font-bold text-zinc-500">Days</span>
          </div>
          <span className="text-[10px] text-orange-400/90 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-orange-400" /> {streak > 0 ? 'Streak is active!' : 'Start your streak today'}
          </span>
        </div>

        {/* Leaderboard Rank */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gym Ranking</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black text-white tracking-tight">#{rank}</span>
            <span className="text-xs font-bold text-zinc-500">Rank</span>
          </div>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-yellow-500" /> {rank <= 3 ? 'On the Podium!' : 'Top Member'}
          </span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-red-500" /> Earned Badges
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">{badges.length} unlocked</span>
        </div>

        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((b, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs text-zinc-200 transition-all cursor-default"
                title={b.description || b.name}
              >
                <span className="text-base">{b.icon_emoji}</span>
                <span className="font-semibold text-zinc-300">{b.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-zinc-900/40 border border-dashed border-zinc-800/80 rounded-xl text-center">
            <p className="text-xs text-zinc-500">
              🎯 No badges unlocked yet. Submit your workout logs to your trainer to earn points and badges!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function MemberDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, requestsRes, routinesRes, noticesRes, timetableRes, pointsRes, badgesRes] = await Promise.all([
    supabase.from('profiles').select('full_name, user_id_code').eq('id', user!.id).single(),
    supabase.from('requests').select('id, status, request_type, created_at').eq('member_id', user!.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('routines').select('day_label, exercise_name').eq('member_id', user!.id).order('day_label'),
    supabase.from('gym_notices').select('id, title, body, type, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('gym_timetable').select('id, day_label, open_time, close_time, is_closed').order('display_order', { ascending: true }),
    supabase.from('member_points').select('total_points, weekly_points, streak_days').eq('member_id', user!.id).maybeSingle(),
    supabase.from('member_badges').select('awarded_at, badges(name, icon_emoji, description)').eq('member_id', user!.id),
  ])

  const profile = profileRes.data as { full_name: string | null; user_id_code: string | null } | null
  const myRequests: any[] = (requestsRes.data as any) || []
  const routines: any[] = (routinesRes.data as any) || []
  const gymNotices: { id: string; title: string; body: string; type: 'info' | 'warning' | 'success'; created_at: string }[] = (noticesRes.data as any) || []
  const gymHours: { id: string; day_label: string; open_time: string; close_time: string; is_closed: boolean }[] = (timetableRes.data as any) || []

  const myPoints = pointsRes.data as { total_points?: number; weekly_points?: number; streak_days?: number } | null
  const totalPoints = myPoints?.total_points || 0
  const streakDays = myPoints?.streak_days || 0
  const weeklyPoints = myPoints?.weekly_points || 0

  let myRank = 1
  if (totalPoints > 0) {
    const { count } = await supabase
      .from('member_points')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', totalPoints)
    myRank = (count || 0) + 1
  }

  const rawBadges = (badgesRes.data as any[]) || []
  const myBadges = rawBadges
    .map(b => b.badges)
    .filter(Boolean)

  const uniqueDays = [...new Set(routines.map(r => r.day_label))]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {user && <PushOptIn userId={user.id} />}
      {/* Member ID gate — shows popup if user_id_code is missing */}
      <MemberIdGate />
      
      {/* Header */}
      <DashboardHeader
        initialName={profile?.full_name || 'Athlete'}
        greeting={greeting}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workout Days', value: uniqueDays.length || 0, icon: '🏋️', color: 'red' },
          { label: 'Active Requests', value: myRequests?.filter(r => r.status !== 'completed').length || 0, icon: '📋', color: 'orange' },
          { label: 'Plan Status', value: uniqueDays.length > 0 ? 'Active' : 'Pending', icon: '⚡', color: 'green' },
          { label: 'Streak Days', value: streakDays > 0 ? `${streakDays} Days` : '0 Days', icon: '🔥', color: 'yellow' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-red-800/40 transition-colors">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Points & Badges Widget */}
      <PointsWidget
        totalPoints={totalPoints}
        streak={streakDays}
        rank={myRank}
        weeklyPoints={weeklyPoints}
        badges={myBadges}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gym Billboard */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <span className="w-6 h-[2px] bg-red-600" /> Gym Billboard
            <span className="ml-auto text-[10px] font-semibold bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
          </h2>
          {gymNotices.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center">
              <p className="text-2xl mb-2">📢</p>
              <p className="text-zinc-600 text-sm">No announcements right now. Check back later!</p>
            </div>
          ) : gymNotices.map((notice) => (
            <div key={notice.id} className={`p-4 rounded-xl border ${
              notice.type === 'success' ? 'bg-green-950/20 border-green-800/30' :
              notice.type === 'warning' ? 'bg-yellow-950/20 border-yellow-800/30' :
              'bg-blue-950/20 border-blue-800/30'
            }`}>
              <h3 className={`font-bold text-sm ${
                notice.type === 'success' ? 'text-green-400' :
                notice.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
              }`}>{notice.title}</h3>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{notice.body}</p>
              <p className="text-xs text-zinc-600 mt-2">{new Date(notice.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}

          {/* Quick Actions */}
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 pt-2">
            <span className="w-6 h-[2px] bg-red-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/member/leaderboard', label: 'Leaderboard', icon: '🏆', desc: 'See rankings' },
              { href: '/member/activity-log', label: 'My Activity', icon: '📈', desc: 'Workout logs' },
              { href: '/member/request', label: 'Request Plan', icon: '📋', desc: 'Get a trainer' },
              { href: '/member/my-plan', label: 'My Workout', icon: '💪', desc: 'View routine' },
              { href: '/member/diet', label: 'Diet Chart', icon: '🥗', desc: 'See nutrition' },
              { href: '/member/explore', label: 'Exercise Library', icon: '🔍', desc: 'Browse exercises' },
            ].map(action => (
              <a key={action.href} href={action.href}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-700/50 hover:bg-red-950/10 transition-all duration-300 group">
                <div className="text-xl mb-2">{action.icon}</div>
                <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{action.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{action.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Gym Hours */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="w-4 h-[2px] bg-red-600" /> Gym Hours
            </h2>
            <div className="space-y-3">
              {gymHours.length > 0 ? gymHours.map(h => (
                <div key={h.id} className="flex flex-col gap-0.5">
                  <span className="text-xs text-zinc-500">{h.day_label}</span>
                  <span className="text-sm font-semibold text-white">
                    {h.is_closed ? '🔒 Closed' : `${h.open_time} – ${h.close_time}`}
                  </span>
                </div>
              )) : (
                <p className="text-xs text-zinc-600">Hours not available</p>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="w-4 h-[2px] bg-red-600" /> My Requests
            </h2>
            {myRequests && myRequests.length > 0 ? (
              <div className="space-y-3">
                {myRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white capitalize">{req.request_type}</p>
                      <p className="text-xs text-zinc-600">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      req.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      req.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-600 text-sm">No requests yet</p>
                <a href="/member/request" className="text-red-500 text-xs hover:text-red-400 mt-1 block">Create one →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
