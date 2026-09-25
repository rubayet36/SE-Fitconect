'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { History, ChevronLeft, PlusCircle, Clock, CheckCircle2, XCircle, Dumbbell, Zap } from 'lucide-react'

type ExerciseLog = {
  id: string
  exercise_name: string
  sets_completed: number
  reps_completed: string
  duration_mins: number | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  points_awarded: number
  submitted_at: string
  reviewed_at: string | null
  trainer_id: string
}

export default function ActivityLogPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [trainersMap, setTrainersMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('member_id', user.id)
        .order('submitted_at', { ascending: false })

      if (data) {
        setLogs(data as ExerciseLog[])

        // Fetch trainer names
        const trainerIds = Array.from(new Set(data.map((l: any) => l.trainer_id)))
        if (trainerIds.length > 0) {
          const { data: trainerProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', trainerIds)

          if (trainerProfiles) {
            const map = Object.fromEntries(
              trainerProfiles.map((tp) => [tp.id, tp.full_name || 'Coach'])
            )
            setTrainersMap(map)
          }
        }
      }

      setLoading(false)
    }

    loadLogs()
  }, [supabase])

  const approvedCount = logs.filter((l) => l.status === 'approved').length
  const pendingCount = logs.filter((l) => l.status === 'pending').length
  const totalEarnedPoints = logs.reduce((acc, l) => acc + (l.points_awarded || 0), 0)

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <History size={14} /> Audit Trail
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Exercise History & Approvals</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Track all your submitted workout logs, points awarded, and trainer review feedback.
          </p>
        </div>

        <Link
          href="/member/log-exercise"
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle size={16} /> Log Workout
        </Link>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Verified Points</div>
          <div className="text-2xl font-black text-green-400 mt-1 flex items-center gap-1.5 font-mono">
            <Zap size={20} className="text-yellow-500" />
            {totalEarnedPoints.toLocaleString()} pts
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Approved Workouts</div>
          <div className="text-2xl font-black text-white mt-1">
            {approvedCount}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Pending Review</div>
          <div className="text-2xl font-black text-yellow-400 mt-1">
            {pendingCount}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4">
          <div className="text-4xl">📋</div>
          <h2 className="text-lg font-bold text-white">No exercise logs yet</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Once you complete a workout session, log your sets to earn verified gamification points.
          </p>
          <Link
            href="/member/log-exercise"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            <PlusCircle size={15} /> Log Your First Exercise
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isApproved = log.status === 'approved'
            const isRejected = log.status === 'rejected'
            const isPending = log.status === 'pending'
            const trainerName = trainersMap[log.trainer_id] || 'Assigned Trainer'

            return (
              <div
                key={log.id}
                className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-zinc-900 border border-zinc-800 text-red-500 rounded-xl">
                      <Dumbbell size={18} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">{log.exercise_name}</h3>
                      <p className="text-xs text-zinc-500">
                        Reviewed by <strong className="text-zinc-400">{trainerName}</strong> •{' '}
                        {new Date(log.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1 pl-11">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">
                      {log.sets_completed} Sets × {log.reps_completed} Reps
                    </span>
                    {log.duration_mins ? (
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">
                        ⏱️ {log.duration_mins} mins
                      </span>
                    ) : null}
                  </div>

                  {log.notes && (
                    <p className="text-xs text-zinc-500 italic pl-11">
                      &quot;{log.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-900">
                  {isApproved && (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 size={13} /> Approved
                      </span>
                      <span className="text-sm font-black text-green-400 font-mono">
                        +{log.points_awarded} pts
                      </span>
                    </>
                  )}

                  {isPending && (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold uppercase tracking-wider">
                        <Clock size={13} /> Pending Review
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        In Trainer Queue
                      </span>
                    </>
                  )}

                  {isRejected && (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                        <XCircle size={13} /> Rejected
                      </span>
                      <span className="text-xs text-zinc-600 font-mono">
                        0 pts
                      </span>
                    </>
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
