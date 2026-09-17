'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Flame, Zap, Crown, Sparkles, RefreshCw, ArrowUpRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export type LeaderboardEntry = {
  rank?: number
  member_id: string
  full_name: string
  avatar_url: string | null
  total_points: number
  weekly_points: number
  streak_days: number
  isCurrentUser?: boolean
}

// Rich mock data fallback for development or when database has few entries
const MOCK_DATA: LeaderboardEntry[] = [
  { member_id: 'mock-1', full_name: 'Ahmed Khan', avatar_url: null, total_points: 1250, weekly_points: 180, streak_days: 14 },
  { member_id: 'mock-2', full_name: 'Sara Hossain', avatar_url: null, total_points: 1040, weekly_points: 140, streak_days: 11 },
  { member_id: 'mock-3', full_name: 'Rafi Islam', avatar_url: null, total_points: 890, weekly_points: 115, streak_days: 9 },
  { member_id: 'mock-4', full_name: 'Tanvir Rahman', avatar_url: null, total_points: 760, weekly_points: 90, streak_days: 7 },
  { member_id: 'mock-5', full_name: 'Nusrat Jahan', avatar_url: null, total_points: 680, weekly_points: 85, streak_days: 6 },
  { member_id: 'mock-6', full_name: 'Farhan Chowdhury', avatar_url: null, total_points: 590, weekly_points: 70, streak_days: 5 },
  { member_id: 'mock-7', full_name: 'Zubair Al-Mamun', avatar_url: null, total_points: 520, weekly_points: 65, streak_days: 4 },
  { member_id: 'mock-8', full_name: 'Anika Tabassum', avatar_url: null, total_points: 480, weekly_points: 50, streak_days: 4 },
  { member_id: 'mock-9', full_name: 'Siam Ahmed', avatar_url: null, total_points: 410, weekly_points: 40, streak_days: 3 },
  { member_id: 'mock-10', full_name: 'Mehnaz Haque', avatar_url: null, total_points: 360, weekly_points: 35, streak_days: 2 },
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'alltime' | 'weekly'>('alltime')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserData, setCurrentUserData] = useState<LeaderboardEntry | null>(null)
  const [isUsingMock, setIsUsingMock] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function initUserAndLeaderboard() {
      setLoading(true)
      try {
        // 1. Get current logged-in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }

        // 2. Fetch live leaderboard data from API
        const res = await fetch('/api/gamification/leaderboard')
        const json = await res.json()

        if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: LeaderboardEntry[] = json.data.map((item: any) => ({
            member_id: item.member_id,
            full_name: item.profiles?.full_name || 'Anonymous Athlete',
            avatar_url: item.profiles?.avatar_url || null,
            total_points: item.total_points || 0,
            weekly_points: item.weekly_points || 0,
            streak_days: item.streak_days || 0,
            isCurrentUser: user ? item.member_id === user.id : false,
          }))

          setEntries(mapped)
          setIsUsingMock(false)

          // Check if current user is in mapped list
          if (user) {
            const foundUser = mapped.find(m => m.member_id === user.id)
            if (foundUser) {
              setCurrentUserData(foundUser)
            } else {
              // Fetch user's individual points if outside top 20
              const { data: userPoints } = await supabase
                .from('member_points')
                .select('total_points, weekly_points, streak_days')
                .eq('member_id', user.id)
                .single()

              const { data: userProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

              if (userPoints) {
                setCurrentUserData({
                  member_id: user.id,
                  full_name: userProfile?.full_name || 'You',
                  avatar_url: userProfile?.avatar_url || null,
                  total_points: userPoints.total_points || 0,
                  weekly_points: userPoints.weekly_points || 0,
                  streak_days: userPoints.streak_days || 0,
                  isCurrentUser: true,
                })
              }
            }
          }
        } else {
          // Fallback to rich mock data if no entries exist yet
          useMockFallback(user?.id)
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        useMockFallback(undefined)
      } finally {
        setLoading(false)
      }
    }

    initUserAndLeaderboard()
  }, [])

  function useMockFallback(userId?: string) {
    setIsUsingMock(true)
    const mockList = MOCK_DATA.map((item, idx) => ({
      ...item,
      isCurrentUser: userId ? idx === 3 : false, // Highlight rank 4 in mock preview for demo
    }))
    setEntries(mockList)
    if (userId) {
      setCurrentUserData(mockList[3])
    }
  }

  // Sort and assign rank based on selected tab
  const sortedEntries = [...entries]
    .sort((a, b) => (tab === 'alltime' ? b.total_points - a.total_points : b.weekly_points - a.weekly_points))
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      isCurrentUser: currentUserId ? item.member_id === currentUserId || item.isCurrentUser : item.isCurrentUser,
    }))

  const topThree = sortedEntries.slice(0, 3)
  const remainingRanks = sortedEntries.slice(3)

  // Find current user rank
  const currentUserRank = sortedEntries.find(e => e.isCurrentUser)?.rank || 
    (currentUserData ? sortedEntries.length + 1 : null)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400">
              <Trophy className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Leaderboard <span className="text-red-500 font-serif">#1</span>
              </h1>
              <p className="text-xs lg:text-sm text-zinc-400 mt-0.5">
                Compete with gym members, maintain streaks, and earn points for verified workouts.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setTab('alltime')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'alltime'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            All-Time
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'weekly'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            This Week
          </button>
        </div>
      </div>

      {isUsingMock && (
        <div className="bg-amber-950/20 border border-amber-800/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-2">
            <span>✨</span> Showing leaderboard preview with demo athlete data. Points update live when workouts are approved!
          </span>
          <Link href="/member/activity-log" className="underline hover:text-amber-200 font-semibold flex items-center gap-1">
            Log activity <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 - Silver */}
          <div className="order-2 md:order-1 bg-zinc-950 border rank-silver rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-3 left-3 text-2xl font-black text-slate-400">#2</div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-lg shadow-slate-400/20 mb-3">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-slate-200 text-lg">
                {topThree[1].full_name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-400/15 border border-slate-400/30 text-[11px] font-bold text-slate-300 mb-1">
              🥈 Silver Medal
            </div>
            <h3 className="font-black text-base text-white truncate max-w-full">
              {topThree[1].full_name} {topThree[1].isCurrentUser && <span className="text-green-400 text-xs">(You)</span>}
            </h3>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 w-full justify-center text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>{(tab === 'alltime' ? topThree[1].total_points : topThree[1].weekly_points).toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1 text-orange-400 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{topThree[1].streak_days}d streak</span>
              </div>
            </div>
          </div>

          {/* Rank 1 - Gold (Center & Elevated) */}
          <div className="order-1 md:order-2 bg-zinc-950 border rank-gold rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.03] shadow-xl shadow-amber-500/10 md:-translate-y-2">
            <div className="absolute top-3 right-3">
              <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div className="absolute top-3 left-3 text-2xl font-black text-amber-400">#1</div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-xl shadow-amber-400/30 mb-3">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-amber-300 text-2xl">
                {topThree[0].full_name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-xs font-black text-amber-300 mb-1">
              🥇 Champion
            </div>
            <h3 className="font-black text-lg text-white truncate max-w-full">
              {topThree[0].full_name} {topThree[0].isCurrentUser && <span className="text-green-400 text-xs">(You)</span>}
            </h3>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 w-full justify-center text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <Zap className="w-4 h-4 fill-amber-400" />
                <span>{(tab === 'alltime' ? topThree[0].total_points : topThree[0].weekly_points).toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1 text-orange-400 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{topThree[0].streak_days}d streak</span>
              </div>
            </div>
          </div>

          {/* Rank 3 - Bronze */}
          <div className="order-3 md:order-3 bg-zinc-950 border rank-bronze rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-3 left-3 text-2xl font-black text-amber-600">#3</div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 p-0.5 shadow-lg shadow-amber-700/20 mb-3">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-amber-500 text-lg">
                {topThree[2].full_name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600/15 border border-amber-600/30 text-[11px] font-bold text-amber-400 mb-1">
              🥉 Bronze Medal
            </div>
            <h3 className="font-black text-base text-white truncate max-w-full">
              {topThree[2].full_name} {topThree[2].isCurrentUser && <span className="text-green-400 text-xs">(You)</span>}
            </h3>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 w-full justify-center text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>{(tab === 'alltime' ? topThree[2].total_points : topThree[2].weekly_points).toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1 text-orange-400 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{topThree[2].streak_days}d streak</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Standing Banner (if user has rank) */}
      {currentUserData && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-green-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-green-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center font-black text-green-400 text-lg">
              #{currentUserRank || '—'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-xs uppercase tracking-wider font-bold text-green-400">Your Current Standing</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {currentUserData.full_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Points</span>
              <div className="text-lg font-black text-amber-400 flex items-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400" />
                <span>{(tab === 'alltime' ? currentUserData.total_points : currentUserData.weekly_points).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Streak</span>
              <div className="text-lg font-black text-orange-400 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-orange-400" />
                <span>{currentUserData.streak_days} days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table (Top 20) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Top 20 Athletes
          </h2>
          <span className="text-xs text-zinc-500">
            {tab === 'alltime' ? 'Ranked by Total Points' : 'Ranked by Points This Week'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin mx-auto" />
            <p className="text-sm text-zinc-500">Loading leaderboard rankings...</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {sortedEntries.map((entry) => {
              const isFirst = entry.rank === 1
              const isSecond = entry.rank === 2
              const isThird = entry.rank === 3

              return (
                <div
                  key={entry.member_id}
                  className={`leaderboard-row flex items-center justify-between p-4 sm:px-6 transition-all ${
                    entry.isCurrentUser ? 'current-user-row bg-green-950/15' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Left: Rank & User Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 text-center flex-shrink-0">
                      {isFirst ? (
                        <span className="text-xl">🥇</span>
                      ) : isSecond ? (
                        <span className="text-xl">🥈</span>
                      ) : isThird ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-sm font-black text-zinc-500">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar / Initials */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                      isFirst
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isSecond
                        ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                        : isThird
                        ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}>
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.full_name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-green-400' : 'text-white'}`}>
                          {entry.full_name}
                        </p>
                        {entry.isCurrentUser && (
                          <span className="bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 sm:hidden mt-0.5">
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                        {entry.streak_days}d streak
                      </p>
                    </div>
                  </div>

                  {/* Right: Points & Streak */}
                  <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span>{entry.streak_days} days</span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-1">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{(tab === 'alltime' ? entry.total_points : entry.weekly_points).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Motivational Bottom Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-bold text-white text-base">Want to climb the leaderboard?</h3>
          <p className="text-xs text-zinc-400">Complete exercises, submit logs to your trainer for approval, and earn up to 50 pts per exercise!</p>
        </div>
        <Link
          href="/member/my-plan"
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 whitespace-nowrap"
        >
          View Workout Plan →
        </Link>
      </div>
    </div>
  )
}
