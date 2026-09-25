'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ChevronLeft, Dumbbell, Zap, Flame, User, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

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
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export default function TrainerApprovalsPage() {
  const supabase = createClient()

  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  async function loadLogs() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch exercise logs for this trainer
    const { data: logsData, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('trainer_id', user.id)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('[approvals] Fetch error:', error)
      toast.error('Failed to fetch approval queue')
      setLoading(false)
      return
    }

    const memberIds = Array.from(new Set((logsData || []).map((l: any) => l.member_id)))
    let profileMap: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {}

    if (memberIds.length > 0) {
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', memberIds)

      if (memberProfiles) {
        profileMap = Object.fromEntries(
          memberProfiles.map((p: any) => [p.id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }])
        )
      }
    }

    const enriched = (logsData || []).map((log: any) => ({
      ...log,
      profiles: profileMap[log.member_id] || { full_name: 'Gym Athlete', email: null, avatar_url: null },
    }))

    setLogs(enriched)
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  async function handleReview(logId: string, status: 'approved' | 'rejected') {
    setActionId(logId)
    try {
      const res = await fetch('/api/gamification/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, status }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || `Failed to mark workout as ${status}`)
      }

      toast.success(
        status === 'approved'
          ? `Approved! Awarded ~${json.data?.points_awarded || 10} points to athlete.`
          : 'Workout marked as rejected.'
      )

      // Optimistic state update
      setLogs((prev) =>
        prev.map((item) =>
          item.id === logId
            ? {
                ...item,
                status,
                reviewed_at: new Date().toISOString(),
                points_awarded: json.data?.points_awarded ?? item.points_awarded,
              }
            : item
        )
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Something went wrong')
    } finally {
      setActionId(null)
    }
  }

  const pendingLogs = logs.filter((l) => l.status === 'pending')
  const historyLogs = logs.filter((l) => l.status !== 'pending')
  const currentList = tab === 'pending' ? pendingLogs : historyLogs

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/trainer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Trainer HQ
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <Zap size={14} /> Verification HQ
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Exercise Approval Queue</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Review completed workouts from your athletes and confirm point rewards.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              tab === 'pending'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending Review
            {pendingLogs.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                tab === 'pending' ? 'bg-black/30 text-white' : 'bg-red-600 text-white'
              }`}>
                {pendingLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Review History ({historyLogs.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-3">
          <p className="text-4xl">🎉</p>
          <h2 className="text-lg font-bold text-white">
            {tab === 'pending' ? 'All Caught Up!' : 'No Past Reviews'}
          </h2>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            {tab === 'pending'
              ? 'No pending exercise submissions waiting for your verification.'
              : 'You have not approved or rejected any exercise submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((log) => {
            const memberName = log.profiles?.full_name || 'Gym Athlete'
            const memberEmail = log.profiles?.email
            const sets = log.sets_completed || 1
            const duration = log.duration_mins || 0
            const estimatedPts = 10 + (sets * 2) + (duration >= 30 ? 5 : 0)
            const isProcessing = actionId === log.id

            return (
              <div
                key={log.id}
                className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-700 transition-all"
              >
                {/* Left: Workout & Member details */}
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-sm text-red-500 shrink-0">
                      {memberName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{memberName}</span>
                        {memberEmail && (
                          <span className="text-xs text-zinc-500 hidden sm:inline">({memberEmail})</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Submitted {new Date(log.submitted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-13">
                    <div className="flex items-center gap-2 text-white font-bold text-base">
                      <Dumbbell size={16} className="text-red-500 shrink-0" />
                      <span>{log.exercise_name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-zinc-300">
                        {log.sets_completed} Sets × {log.reps_completed} Reps
                      </span>
                      {log.duration_mins && (
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-zinc-300 flex items-center gap-1">
                          <Clock size={12} className="text-zinc-500" /> {log.duration_mins} mins
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-mono font-bold flex items-center gap-1">
                        <Zap size={12} /> Yields +{estimatedPts} pts
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 mt-2 flex items-start gap-1.5">
                        <MessageSquare size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                        <span>&quot;{log.notes}&quot;</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions or Review Status */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-zinc-900 w-full md:w-auto justify-end">
                  {log.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleReview(log.id, 'rejected')}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-800 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button
                        onClick={() => handleReview(log.id, 'approved')}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={15} /> Approve (+{estimatedPts} pts)
                      </button>
                    </>
                  ) : log.status === 'approved' ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 size={13} /> Approved
                      </span>
                      <p className="text-xs font-mono text-green-400 font-bold mt-1">
                        +{log.points_awarded || estimatedPts} pts awarded
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                        <XCircle size={13} /> Rejected
                      </span>
                      <p className="text-xs font-mono text-zinc-600 mt-1">
                        0 pts awarded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
