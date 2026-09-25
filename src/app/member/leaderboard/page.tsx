'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Flame, ChevronLeft, Zap, Sparkles, PlusCircle } from 'lucide-react'
import { RankBadge } from '@/components/gamification'

type LeaderboardRow = {
  member_id: string
  total_points: number
  weekly_points: number
  monthly_points: number
  streak_days: number
  last_activity_date: string | null
  profiles: {
    full_name: string | null
    avatar_url: string | null
  }
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'alltime' | 'weekly'>('alltime')
  const [entries, setEntries] = useState<LeaderboardRow[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error('Failed to load leaderboard data')
        }
        const json = await res.json()
        setEntries(json.data || [])
        setCurrentUserId(json.currentUserId || null)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Unable to connect to leaderboard service')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeframe])

  const top3 = entries.slice(0, 3)
  const currentUserIndex = entries.findIndex((e) => e.member_id === currentUserId)
  const currentUserEntry = currentUserIndex !== -1 ? entries[currentUserIndex] : null

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/member/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-500" /> VORTEX Hall of Fame
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Gym Leaderboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Real-time verified standings based on trainer-approved workouts and consistency.
          </p>
        </div>

        {/* Timeframe switch */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              timeframe === 'alltime'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              timeframe === 'weekly'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
          <div className="h-96 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-800/40 text-center space-y-3">
          <p className="text-red-400 font-bold text-sm">Failed to load live leaderboard</p>
          <p className="text-zinc-500 text-xs">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4">
          <div className="text-5xl">🏆</div>
          <h2 className="text-xl font-bold text-white">Be the First on the Leaderboard!</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            No workouts have been approved yet for this timeframe. Complete a gym session and submit it to take the #1 spot!
          </p>
          <Link
            href="/member/log-exercise"
            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            <PlusCircle size={15} /> Log Exercise Now
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (when at least 1 entry exists) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* #2 Silver (left on desktop) */}
              {top3[1] ? (
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-900/60 to-zinc-950 border border-slate-800/80 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl">🥈</div>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Rank #2 • Silver
                    </span>
                    <h3 className="text-lg font-bold text-white truncate px-2">
                      {top3[1].profiles?.full_name || 'Athlete'}
                    </h3>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-around text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Points</span>
                      <span className="font-black text-white font-mono text-base">
                        {timeframe === 'weekly' ? top3[1].weekly_points : top3[1].total_points}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Streak</span>
                      <span className="font-bold text-orange-400 font-mono text-base flex items-center gap-0.5 justify-center">
                        <Flame size={14} /> {top3[1].streak_days}d
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="order-2 md:order-1 hidden md:block" />
              )}

              {/* #1 Gold Champion (Center) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-zinc-900/90 to-zinc-950 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4 relative shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-4xl animate-bounce">👑</div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                    🥇 #1 Champion
                  </div>
                  <h3 className="text-xl font-black text-white truncate px-2">
                    {top3[0].profiles?.full_name || 'Athlete'}
                  </h3>
                </div>
                <div className="pt-3 border-t border-amber-950/60 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Points</span>
                    <span className="font-black text-amber-400 font-mono text-xl">
                      {timeframe === 'weekly' ? top3[0].weekly_points : top3[0].total_points}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Streak</span>
                    <span className="font-bold text-orange-400 font-mono text-xl flex items-center gap-0.5 justify-center">
                      <Flame size={16} /> {top3[0].streak_days}d
                    </span>
                  </div>
                </div>
              </div>

              {/* #3 Bronze (right on desktop) */}
              {top3[2] ? (
                <div className="order-3 bg-gradient-to-b from-orange-950/30 to-zinc-950 border border-orange-900/40 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl">🥉</div>
                    <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest block">
                      Rank #3 • Bronze
                    </span>
                    <h3 className="text-lg font-bold text-white truncate px-2">
                      {top3[2].profiles?.full_name || 'Athlete'}
                    </h3>
                  </div>
                  <div className="pt-2 border-t border-orange-950/60 flex items-center justify-around text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Points</span>
                      <span className="font-black text-white font-mono text-base">
                        {timeframe === 'weekly' ? top3[2].weekly_points : top3[2].total_points}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Streak</span>
                      <span className="font-bold text-orange-400 font-mono text-base flex items-center gap-0.5 justify-center">
                        <Flame size={14} /> {top3[2].streak_days}d
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="order-3 hidden md:block" />
              )}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Standings Table (Top {entries.length})
              </span>
              {currentUserEntry && (
                <span className="text-xs font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  Your Rank: #{currentUserIndex + 1}
                </span>
              )}
            </div>

            <div className="divide-y divide-zinc-900">
              {entries.map((entry, index) => {
                const rank = index + 1
                const isCurrentUser = entry.member_id === currentUserId
                const points = timeframe === 'weekly' ? entry.weekly_points : entry.total_points
                const name = entry.profiles?.full_name || 'Gym Member'

                return (
                  <div
                    key={entry.member_id}
                    className={`flex items-center justify-between p-4 px-6 transition-all ${
                      isCurrentUser
                        ? 'bg-red-950/20 border-l-4 border-l-red-500'
                        : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 shrink-0 flex justify-center">
                        <RankBadge rank={rank} />
                      </div>

                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-300 shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{name}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-orange-400 font-mono">
                            <Flame size={12} /> {entry.streak_days}d streak
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-white font-mono flex items-center justify-end gap-1">
                        <Zap size={14} className="text-yellow-500" />
                        {points.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        PTS
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
