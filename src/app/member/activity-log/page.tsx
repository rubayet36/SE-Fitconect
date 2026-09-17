'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Search,
  Dumbbell,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Award
} from 'lucide-react'
import Link from 'next/link'

type ExerciseLog = {
  id: string
  member_id: string
  trainer_id: string
  exercise_name: string
  exercise_db_id: string | null
  sets_completed: number
  reps_completed: string
  duration_mins: number | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  points_awarded: number
  submitted_at: string
  reviewed_at: string | null
  created_at: string
}

// Mock fallback data for preview when no database entries exist yet
const MOCK_LOGS: ExerciseLog[] = [
  {
    id: 'mock-1',
    member_id: 'user-1',
    trainer_id: 'trainer-1',
    exercise_name: 'Barbell Bench Press',
    exercise_db_id: null,
    sets_completed: 4,
    reps_completed: '10, 10, 8, 8',
    duration_mins: 25,
    notes: 'Good depth and locked elbows safely.',
    status: 'approved',
    points_awarded: 50,
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'mock-2',
    member_id: 'user-1',
    trainer_id: 'trainer-1',
    exercise_name: 'Incline Dumbbell Fly',
    exercise_db_id: null,
    sets_completed: 3,
    reps_completed: '12, 12, 10',
    duration_mins: 15,
    notes: 'Pending trainer review.',
    status: 'pending',
    points_awarded: 0,
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    reviewed_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'mock-3',
    member_id: 'user-1',
    trainer_id: 'trainer-1',
    exercise_name: 'Barbell Squat',
    exercise_db_id: null,
    sets_completed: 4,
    reps_completed: '8, 8, 6, 6',
    duration_mins: 30,
    notes: 'Great form on the eccentric phase!',
    status: 'approved',
    points_awarded: 50,
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'mock-4',
    member_id: 'user-1',
    trainer_id: 'trainer-1',
    exercise_name: 'Overhead Shoulder Press',
    exercise_db_id: null,
    sets_completed: 3,
    reps_completed: '10, 10, 8',
    duration_mins: 20,
    notes: 'Please record video for proper form review.',
    status: 'rejected',
    points_awarded: 0,
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUsingMock, setIsUsingMock] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from('exercise_logs')
            .select('*')
            .eq('member_id', user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error fetching exercise logs:', error)
            setLogs(MOCK_LOGS)
            setIsUsingMock(true)
          } else if (data && data.length > 0) {
            setLogs(data as ExerciseLog[])
            setIsUsingMock(false)
          } else {
            // If empty in DB, show preview mock data with flag
            setLogs(MOCK_LOGS)
            setIsUsingMock(true)
          }
        } else {
          setLogs(MOCK_LOGS)
          setIsUsingMock(true)
        }
      } catch (err) {
        console.error('Failed to load logs:', err)
        setLogs(MOCK_LOGS)
        setIsUsingMock(true)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesSearch = log.exercise_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Summary statistics
  const totalApproved = logs.filter(l => l.status === 'approved').length
  const totalPending = logs.filter(l => l.status === 'pending').length
  const totalPointsEarned = logs
    .filter(l => l.status === 'approved')
    .reduce((sum, l) => sum + (l.points_awarded || 0), 0)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400">
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                My Activity & Workout Logs
              </h1>
              <p className="text-xs lg:text-sm text-zinc-400 mt-0.5">
                Track all your logged workouts, trainer approvals, and points earned.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/member/my-plan"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <Dumbbell className="w-4 h-4" /> Go to My Plan
          </Link>
          <Link
            href="/member/leaderboard"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-yellow-500" /> Leaderboard
          </Link>
        </div>
      </div>

      {isUsingMock && (
        <div className="bg-amber-950/20 border border-amber-800/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-2">
            <span>✨</span> Showing sample workout activity. Once you log exercises and get trainer approval, your actual history will appear here!
          </span>
          <Link href="/member/my-plan" className="underline hover:text-amber-200 font-semibold flex items-center gap-1">
            View workouts <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl mb-1">🏋️</div>
          <div className="text-2xl font-black text-white">{logs.length}</div>
          <div className="text-xs text-zinc-500 mt-0.5 font-medium">Total Exercises Logged</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-black text-green-400">{totalApproved}</div>
          <div className="text-xs text-zinc-500 mt-0.5 font-medium">Approved & Verified</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-black text-amber-400">{totalPointsEarned} pts</div>
          <div className="text-xs text-zinc-500 mt-0.5 font-medium">Points Earned</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl mb-1">🕐</div>
          <div className="text-2xl font-black text-yellow-400">{totalPending}</div>
          <div className="text-xs text-zinc-500 mt-0.5 font-medium">Pending Review</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          {[
            { key: 'all', label: 'All Logs' },
            { key: 'approved', label: 'Approved' },
            { key: 'pending', label: 'Pending' },
            { key: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin mx-auto" />
            <p className="text-sm text-zinc-500">Loading workout logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-4xl">📋</div>
            <h3 className="text-base font-bold text-white">No exercise logs found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No exercise matches your search query. Try clearing the search bar.'
                : 'You have not submitted any workout logs under this category yet.'}
            </p>
            <Link
              href="/member/my-plan"
              className="inline-block px-4 py-2 mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              View Workout Routine →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                  <th className="py-3.5 px-5">Exercise</th>
                  <th className="py-3.5 px-5">Sets × Reps</th>
                  <th className="py-3.5 px-5">Date Submitted</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredLogs.map((log) => {
                  const isApproved = log.status === 'approved'
                  const isPending = log.status === 'pending'
                  const isRejected = log.status === 'rejected'

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Exercise Name & Notes */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base flex-shrink-0">
                            🏋️
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{log.exercise_name}</p>
                            {log.notes && (
                              <p className="text-xs text-zinc-400 mt-0.5 italic">
                                &quot;{log.notes}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sets × Reps & Duration */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                            <Layers className="w-3.5 h-3.5 text-red-500" />
                            <span>{log.sets_completed} Sets</span>
                            <span className="text-zinc-500 font-normal">({log.reps_completed} reps)</span>
                          </div>
                          {log.duration_mins && (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                              <Clock className="w-3 h-3" />
                              <span>{log.duration_mins} mins</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date Submitted */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(log.submitted_at || log.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/15 border border-green-500/30 text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Points Earned */}
                      <td className="py-4 px-5 text-right">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-sm font-black text-amber-400">
                            <Zap className="w-4 h-4 fill-amber-400" />
                            +{log.points_awarded || 50} pts
                          </span>
                        ) : isPending ? (
                          <span className="text-xs font-bold text-zinc-500">
                            0 pts (Pending)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-zinc-600">
                            0 pts
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
