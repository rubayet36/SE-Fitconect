import { createClient } from '@/lib/supabase/server'
import { PushOptIn } from '@/components/PushOptIn'
import { DashboardHeader } from '@/components/DashboardHeader'
import { StreakTracker, RankBadge, MemberRealtimeNotifier } from '@/components/gamification'
import Link from 'next/link'
import { Zap, Trophy, Flame, ChevronRight, Award, PlusCircle, History, Sparkles, UserCheck, Dumbbell } from 'lucide-react'

export default async function MemberDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    profileRes,
    requestsRes,
    routinesRes,
    noticesRes,
    timetableRes,
    memberPointsRes,
    memberBadgesRes,
    trainersRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, user_id_code').eq('id', user!.id).single(),
    supabase.from('requests').select('id, status, request_type, created_at').eq('member_id', user!.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('routines').select('day_label, exercise_name').eq('member_id', user!.id).order('day_label'),
    supabase.from('gym_notices').select('id, title, body, type, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('gym_timetable').select('id, day_label, open_time, close_time, is_closed').order('display_order', { ascending: true }),
    supabase.from('member_points').select('*').eq('member_id', user!.id).maybeSingle(),
    supabase.from('member_badges').select('id, earned_at, badges(id, name, description, icon_emoji)').eq('member_id', user!.id),
    supabase.from('profiles').select('id, full_name, email, specialization, bio, experience_years').eq('role', 'trainer').limit(4),
  ])

  const profile = profileRes.data as { full_name: string | null; user_id_code: string | null } | null

  // Resolve user display name from profiles, auth metadata, or email
  const userName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string)?.trim() ||
    (user?.user_metadata?.name as string)?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Member'

  // If DB full_name was empty, backfill it so it persists
  if (user && !profile?.full_name && userName && userName !== 'Member') {
    await supabase.from('profiles').update({ full_name: userName }).eq('id', user.id)
  }

  const myRequests: any[] = (requestsRes.data as any) || []
  const routines: any[] = (routinesRes.data as any) || []
  const gymNotices: { id: string; title: string; body: string; type: 'info' | 'warning' | 'success'; created_at: string }[] = (noticesRes.data as any) || []
  const gymHours: { id: string; day_label: string; open_time: string; close_time: string; is_closed: boolean }[] = (timetableRes.data as any) || []
  const coaches: any[] = (trainersRes.data as any) || []

  // Real gamification data
  const memberPoints = memberPointsRes.data
  const totalPoints = memberPoints?.total_points ?? 0
  const streakDays = memberPoints?.streak_days ?? 0
  const lastActivityDate = memberPoints?.last_activity_date ?? null

  // Calculate real leaderboard rank
  let currentRank = 1
  if (memberPoints) {
    const { count } = await supabase
      .from('member_points')
      .select('id', { count: 'exact', head: true })
      .gt('total_points', totalPoints)
    currentRank = (count ?? 0) + 1
  }

  // Real badges
  const earnedBadges = (memberBadgesRes.data || []).map((mb: any) => mb.badges).filter(Boolean)

  const uniqueDays = [...new Set(routines.map(r => r.day_label))]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {user && <PushOptIn userId={user.id} />}
      {user && <MemberRealtimeNotifier userId={user.id} />}
      
      {/* Header */}
      <DashboardHeader
        initialName={userName}
        greeting={greeting}
      />

      {/* Stats row with real Supabase streak */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: `${totalPoints.toLocaleString()} pts`, icon: '⚡', color: 'red' },
          { label: 'Active Streak', value: `${streakDays} Day${streakDays === 1 ? '' : 's'}`, icon: '🔥', color: 'orange' },
          { label: 'Leaderboard Rank', value: totalPoints > 0 ? `#${currentRank}` : 'Unranked', icon: '🏆', color: 'yellow' },
          { label: 'Badges Earned', value: earnedBadges.length, icon: '🏅', color: 'green' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-red-800/40 transition-colors">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Gamification Spotlight Card */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-red-400 animate-pulse" /> Gamification Center
              </span>
              {totalPoints > 0 && <RankBadge rank={currentRank} />}
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              Level Up Your Fitness Journey
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Log your daily completed sets and workouts for trainer review. Earn verified points, keep your streak alive, and climb to the top of the gym leaderboard!
            </p>

            {/* Badges preview */}
            <div className="pt-1">
              <span className="text-xs text-zinc-500 font-semibold block mb-2 uppercase tracking-wider">
                Earned Badges ({earnedBadges.length})
              </span>
              {earnedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((badge: any) => (
                    <span
                      key={badge.id || badge.name}
                      title={`${badge.name}: ${badge.description}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium hover:border-yellow-500/50 transition-colors"
                    >
                      <span>{badge.icon_emoji}</span>
                      <span>{badge.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic">
                  Complete your first approved workout to unlock the 🌱 First Rep badge!
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            <Link
              href="/member/log-exercise"
              className="px-5 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center justify-center gap-2"
            >
              <PlusCircle size={16} /> Log Workout
            </Link>
            <Link
              href="/member/leaderboard"
              className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-zinc-700/60 flex items-center justify-center gap-2"
            >
              <Trophy size={15} className="text-yellow-500" /> Leaderboard <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* 7-Day Activity Streak Strip */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80">
          <StreakTracker streakDays={streakDays} lastActivityDate={lastActivityDate} />
        </div>
      </div>

      {/* Featured Coaches & Specializations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <span className="w-6 h-[2px] bg-red-600" /> Certified Gym Coaches & Specialties
          </h2>
          <Link
            href="/member/request"
            className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors flex items-center gap-1"
          >
            Choose Coach & Request Plan <ChevronRight size={14} />
          </Link>
        </div>

        {coaches.length === 0 ? (
          <div className="p-6 bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl text-center">
            <p className="text-zinc-600 text-xs">No coaches registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coaches.map((coach: any) => {
              const specialties = coach.specialization
                ? coach.specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
                : []

              return (
                <div
                  key={coach.id}
                  className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
                        {(coach.full_name || 'Coach')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-red-400 transition-colors">
                          {coach.full_name || 'Coach'}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {coach.experience_years ? `${coach.experience_years}+ Yrs Exp` : 'Certified Trainer'}
                        </p>
                      </div>
                    </div>

                    {/* Specialization Tags */}
                    <div>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold block mb-1">
                        Specialty
                      </span>
                      {specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {specialties.slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium"
                            >
                              🔥 {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-600 italic">General Fitness & Strength</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/member/request?trainerId=${coach.id}`}
                    className="w-full py-2 bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all border border-zinc-800 block"
                  >
                    Select Coach →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
              { href: '/member/log-exercise', label: 'Log Workout', icon: '⚡', desc: 'Submit for pts' },
              { href: '/member/leaderboard', label: 'Leaderboard', icon: '🏆', desc: 'Check rankings' },
              { href: '/member/activity-log', label: 'Activity Log', icon: '📜', desc: 'View approvals' },
              { href: '/member/my-plan', label: 'My Workout', icon: '💪', desc: 'View routine' },
              { href: '/member/diet', label: 'Diet Chart', icon: '🥗', desc: 'See nutrition' },
              { href: '/member/explore', label: 'Exercise Library', icon: '🔍', desc: 'Browse exercises' },
            ].map(action => (
              <Link key={action.href} href={action.href}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-700/50 hover:bg-red-950/10 transition-all duration-300 group">
                <div className="text-xl mb-2">{action.icon}</div>
                <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{action.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{action.desc}</div>
              </Link>
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
                <Link href="/member/request" className="text-red-500 text-xs hover:text-red-400 mt-1 block">Create one →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
