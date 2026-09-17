'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Layers,
  Search,
  RefreshCw,
  Award,
  Sparkles,
  Dumbbell,
  ChefHat,
  Filter,
  Check,
  X,
  Loader2,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface ExerciseLogItem {
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
  member?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
    user_id_code: string | null
  }
}

export default function TrainerApprovalsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [logs, setLogs] = useState<ExerciseLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [trainerUser, setTrainerUser] = useState<any>(null)

  // ── 1. Fetch Logs for this Trainer ────────────────────────────────────
  const fetchTrainerLogs = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setTrainerUser(user)

      // Query exercise logs assigned to this trainer, joining member profile
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          id,
          member_id,
          trainer_id,
          exercise_name,
          exercise_db_id,
          sets_completed,
          reps_completed,
          duration_mins,
          notes,
          status,
          points_awarded,
          submitted_at,
          reviewed_at,
          profiles!exercise_logs_member_id_fkey(full_name, email, avatar_url, user_id_code)
        `)
        .eq('trainer_id', user.id)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching trainer approvals:', error)
        toast.error('Failed to load pending approvals')
      } else if (data) {
        const formatted: ExerciseLogItem[] = data.map((item: any) => ({
          ...item,
          member: item.profiles || {
            full_name: 'Gym Member',
            email: 'member@fitconnect.com',
            avatar_url: null,
            user_id_code: null,
          },
        }))
        setLogs(formatted)
      }
    } catch (err) {
      console.error('Error loading approvals data:', err)
      toast.error('Unexpected error loading approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainerLogs()
  }, [])

  // ── 2. Estimated Points Formula Helper ────────────────────────────────
  const calculatePoints = (log: ExerciseLogItem) => {
    const base = 10
    const sets = (Number(log.sets_completed) || 1) * 2
    const duration = (Number(log.duration_mins) || 0) >= 30 ? 5 : 0
    return base + sets + duration
  }

  // ── 3. Decision Handler (Approve / Reject) ─────────────────────────────
  async function handleDecision(logId: string, status: 'approved' | 'rejected') {
    const targetLog = logs.find((l) => l.id === logId)
    if (!targetLog) return

    const estimatedPts = calculatePoints(targetLog)
    setProcessingId(logId)

    // Optimistic UI update
    setLogs((prev) =>
      prev.map((item) =>
        item.id === logId
          ? {
              ...item,
              status,
              points_awarded: status === 'approved' ? estimatedPts : 0,
              reviewed_at: new Date().toISOString(),
            }
          : item
      )
    )

    try {
      const res = await fetch('/api/gamification/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, status }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update approval status')
      }

      if (status === 'approved') {
        toast.success(`Approved ${targetLog.exercise_name}!`, {
          description: `+${estimatedPts} points awarded to ${targetLog.member?.full_name || 'Member'}.`,
        })
      } else {
        toast.info(`Rejected ${targetLog.exercise_name}`, {
          description: `Log marked as rejected for ${targetLog.member?.full_name || 'Member'}.`,
        })
      }
    } catch (err: any) {
      console.error('Decision error:', err)
      toast.error(err.message || 'Failed to submit decision')
      // Rollback on error
      fetchTrainerLogs()
    } finally {
      setProcessingId(null)
    }
  }

  // ── 4. Filtering & Search Computations ────────────────────────────────
  const pendingCount = useMemo(() => logs.filter((l) => l.status === 'pending').length, [logs])
  const approvedCount = useMemo(() => logs.filter((l) => l.status === 'approved').length, [logs])
  const rejectedCount = useMemo(() => logs.filter((l) => l.status === 'rejected').length, [logs])
  const totalPointsDistributed = useMemo(
    () => logs.filter((l) => l.status === 'approved').reduce((sum, l) => sum + (l.points_awarded || calculatePoints(l)), 0),
    [logs]
  )

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesTab = activeTab === 'all' || log.status === activeTab
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        log.exercise_name.toLowerCase().includes(q) ||
        (log.member?.full_name && log.member.full_name.toLowerCase().includes(q)) ||
        (log.member?.email && log.member.email.toLowerCase().includes(q)) ||
        (log.notes && log.notes.toLowerCase().includes(q))

      return matchesTab && matchesSearch
    })
  }, [logs, activeTab, searchQuery])

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400">
              <CheckSquare className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                  Exercise Approvals Queue
                </h1>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs lg:text-sm text-zinc-400 mt-0.5">
                Review member workout logs and verify points to fuel their leaderboard rank.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrainerLogs}
            disabled={loading}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} />
            Refresh Queue
          </button>
          <Link
            href="/trainer/workout-builder"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <Dumbbell className="w-4 h-4" /> Workout Builder
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⏳</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              Needs Review
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{pendingCount}</div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Pending Approvals</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xl">✅</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
              Verified
            </span>
          </div>
          <div className="text-2xl font-black text-green-400 mt-2">{approvedCount}</div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Approved Workouts</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚡</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Rewarded
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{totalPointsDistributed} pts</div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Total Points Awarded</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xl">❌</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              Declined
            </span>
          </div>
          <div className="text-2xl font-black text-red-400 mt-2">{rejectedCount}</div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Rejected Submissions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          {[
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
            { key: 'all', label: 'All History', count: logs.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.key ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by member name, exercise, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Queue List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-3">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Loading exercise approvals queue...</p>
            <p className="text-xs text-zinc-500">Connecting with member activity database</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl">
              {activeTab === 'pending' ? '🎉' : '📋'}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {activeTab === 'pending' ? 'All caught up! No pending approvals.' : 'No exercise logs match your filter.'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'Whenever your members finish workouts and submit exercise logs, they will show up here for review.'
                  : 'Try switching tabs or clearing your search term.'}
              </p>
            </div>
            {activeTab === 'pending' && (
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/trainer/diet-generator"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ChefHat size={14} className="text-red-400" /> Diet Generator
                </Link>
                <Link
                  href="/trainer/workout-builder"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5"
                >
                  <Dumbbell size={14} /> Workout Builder
                </Link>
              </div>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isPending = log.status === 'pending'
            const isApproved = log.status === 'approved'
            const isRejected = log.status === 'rejected'
            const isProcessing = processingId === log.id
            const estPts = calculatePoints(log)

            return (
              <div
                key={log.id}
                className={`bg-zinc-950 border rounded-2xl p-5 transition-all relative overflow-hidden ${
                  isPending
                    ? 'border-zinc-800 hover:border-green-500/40 shadow-lg'
                    : isApproved
                    ? 'border-green-500/30 bg-gradient-to-r from-zinc-950 via-zinc-950 to-green-950/10'
                    : 'border-red-500/20 bg-gradient-to-r from-zinc-950 via-zinc-950 to-red-950/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left Column: Member and Exercise Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Member Header */}
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center font-black text-sm text-white shrink-0">
                          {log.member?.full_name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm text-white">
                              {log.member?.full_name || 'FitConnect Member'}
                            </p>
                            {log.member?.user_id_code && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
                                {log.member.user_id_code}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {log.member?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 sm:ml-auto">
                        <Calendar size={13} />
                        <span>
                          {new Date(log.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Exercise & Workout Info Banner */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-600/15 border border-red-500/30 rounded-lg text-red-400">
                          <Dumbbell size={15} />
                        </div>
                        <span className="font-bold text-sm text-white capitalize">
                          {log.exercise_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                        <Layers size={14} className="text-red-500" />
                        <span>{log.sets_completed} Sets × {log.reps_completed}</span>
                      </div>

                      {log.duration_mins && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Clock size={14} className="text-amber-400" />
                          <span>{log.duration_mins} mins</span>
                        </div>
                      )}

                      {/* Points badge */}
                      <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
                        <Zap size={13} className="fill-amber-400" />
                        <span>
                          {isApproved ? `+${log.points_awarded || estPts} pts Awarded` : `~${estPts} pts Potential`}
                        </span>
                      </div>
                    </div>

                    {/* Member Note if present */}
                    {log.notes && (
                      <div className="flex items-start gap-2 bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-2.5 text-xs text-zinc-400 italic">
                        <MessageSquare size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                        <span>&quot;{log.notes}&quot;</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions or Status Indicator */}
                  <div className="lg:border-l lg:border-zinc-800/80 lg:pl-6 flex lg:flex-col items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDecision(log.id, 'approved')}
                          className="flex-1 lg:w-36 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-950/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={15} />
                          )}
                          Approve ({estPts} pts)
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDecision(log.id, 'rejected')}
                          className="flex-1 lg:w-36 py-2.5 px-4 bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 text-red-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <X size={15} />
                          Reject Log
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold">
                        <CheckCircle2 size={16} />
                        <span>Approved</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                        <XCircle size={16} />
                        <span>Rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
