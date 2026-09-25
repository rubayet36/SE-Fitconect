'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Dumbbell, Clock, MessageSquare, UserCheck, ArrowRight, CheckCircle2, History, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

type Trainer = {
  id: string
  full_name: string | null
  email: string
  specialization?: string | null
}

const COMMON_EXERCISES = [
  'Barbell Bench Press',
  'Barbell Squat',
  'Deadlift',
  'Overhead Shoulder Press',
  'Barbell Bent Over Row',
  'Pull-ups / Chin-ups',
  'Dumbbell Incline Press',
  'Leg Press',
  'Lat Pulldown',
  'Bicep Curls',
  'Tricep Pushdowns',
  'Treadmill Running (Cardio)',
]

export default function LogExercisePage() {
  const router = useRouter()
  const supabase = createClient()

  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loadingTrainers, setLoadingTrainers] = useState(true)

  const [trainerId, setTrainerId] = useState('')
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseDbId, setExerciseDbId] = useState('')
  const [setsCompleted, setSetsCompleted] = useState<number>(3)
  const [repsCompleted, setRepsCompleted] = useState<string>('10')
  const [durationMins, setDurationMins] = useState<number>(30)
  const [notes, setNotes] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [pointsPreview, setPointsPreview] = useState<number>(21)

  // Fetch real trainers from Supabase
  useEffect(() => {
    async function loadTrainers() {
      setLoadingTrainers(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Prioritize trainer from existing requests if available
      const { data: requestTrainers } = await supabase
        .from('requests')
        .select('trainer_id')
        .eq('member_id', user.id)

      const assignedTrainerIds = Array.from(new Set((requestTrainers || []).map(r => r.trainer_id)))

      // Fetch all trainer profiles
      const { data: allTrainers } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialization')
        .eq('role', 'trainer')

      const trainerList: Trainer[] = (allTrainers || []).sort((a, b) => {
        const aAssigned = assignedTrainerIds.includes(a.id)
        const bAssigned = assignedTrainerIds.includes(b.id)
        if (aAssigned && !bAssigned) return -1
        if (!aAssigned && bAssigned) return 1
        return (a.full_name || '').localeCompare(b.full_name || '')
      })

      setTrainers(trainerList)
      if (trainerList.length > 0) {
        setTrainerId(trainerList[0].id)
      }
      setLoadingTrainers(false)
    }

    loadTrainers()
  }, [supabase])

  // Calculate live expected points: 10 base + (sets * 2) + (duration >= 30 ? 5 : 0)
  useEffect(() => {
    const sets = Number(setsCompleted) || 0
    const duration = Number(durationMins) || 0
    const calculated = 10 + (sets * 2) + (duration >= 30 ? 5 : 0)
    setPointsPreview(calculated)
  }, [setsCompleted, durationMins])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!trainerId) {
      toast.error('Please select your reviewing trainer')
      return
    }
    if (!exerciseName.trim()) {
      toast.error('Please enter the exercise name')
      return
    }
    if (setsCompleted < 1) {
      toast.error('Please specify at least 1 set completed')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/gamification/log-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: trainerId,
          exercise_name: exerciseName.trim(),
          exercise_db_id: exerciseDbId || null,
          sets_completed: Number(setsCompleted),
          reps_completed: String(repsCompleted).trim() || '10',
          duration_mins: durationMins ? Number(durationMins) : null,
          notes: notes.trim() || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit workout log')
      }

      toast.success('Workout log submitted for trainer approval!')
      setSubmittedSuccess(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setExerciseName('')
    setExerciseDbId('')
    setSetsCompleted(3)
    setRepsCompleted('10')
    setDurationMins(30)
    setNotes('')
    setSubmittedSuccess(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
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
            <Zap size={14} /> Workout Verification
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Log Completed Exercise</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Submit your completed sets to your trainer for official verification and gamification points.
          </p>
        </div>

        <Link
          href="/member/activity-log"
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 flex items-center gap-2 self-start sm:self-auto"
        >
          <History size={15} /> View History
        </Link>
      </div>

      {submittedSuccess ? (
        <div className="p-8 rounded-2xl bg-zinc-950 border border-green-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center mx-auto text-3xl">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Exercise Log Submitted!</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Your workout was successfully dispatched to your trainer. As soon as they approve it, you will earn{' '}
              <span className="text-green-400 font-bold">~{pointsPreview} points</span> and advance your streak!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Log Another Exercise
            </button>
            <Link
              href="/member/activity-log"
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-zinc-800"
            >
              Check Review Status →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            {/* Trainer selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} className="text-red-500" /> Assigned Trainer
              </label>
              {loadingTrainers ? (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 text-sm animate-pulse">
                  Loading gym trainers...
                </div>
              ) : trainers.length === 0 ? (
                <div className="p-4 bg-yellow-950/20 border border-yellow-800/30 rounded-xl text-yellow-400 text-xs">
                  No trainers registered in the system yet. Please contact gym administration.
                </div>
              ) : (
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white transition-all outline-none"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || 'Trainer'}{t.specialization ? ` • [${t.specialization}]` : ''} ({t.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Exercise name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell size={14} className="text-red-500" /> Exercise Performed
              </label>
              <input
                type="text"
                placeholder="e.g. Barbell Bench Press, Squats, Treadmill..."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />

              {/* Quick suggestions pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_EXERCISES.slice(0, 6).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setExerciseName(item)}
                    className="text-[11px] px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets & Reps row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Sets Completed
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={setsCompleted}
                  onChange={(e) => setSetsCompleted(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Reps per Set
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10 or 10-12"
                  value={repsCompleted}
                  onChange={(e) => setRepsCompleted(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-red-500" /> Workout Duration (Minutes)
                </span>
                <span className="text-[10px] text-green-400 font-normal">≥30 mins = +5 bonus pts!</span>
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={durationMins}
                onChange={(e) => setDurationMins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white transition-all outline-none"
              />
            </div>

            {/* Member notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-red-500" /> Notes for Trainer (Optional)
              </label>
              <textarea
                placeholder="e.g. Used 60kg barbell, felt strong throughout all sets."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 transition-all outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || trainers.length === 0}
              className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? 'Submitting to Trainer...' : 'Submit Workout for Review'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Right sidebar: Point Calculator & Rules */}
          <div className="space-y-6">
            {/* Live Point Estimator Card */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Zap size={14} className="text-yellow-500" /> Live Points Estimator
              </div>
              <div className="flex items-baseline gap-2 my-4">
                <span className="text-5xl font-black text-white">{pointsPreview}</span>
                <span className="text-lg text-red-500 font-bold">PTS</span>
              </div>
              <p className="text-xs text-zinc-400">
                Points will be awarded automatically once your assigned trainer confirms the workout.
              </p>

              <div className="mt-5 pt-5 border-t border-zinc-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Base Approval</span>
                  <span className="text-white font-mono">+10 pts</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Completed Sets ({setsCompleted} × 2)</span>
                  <span className="text-white font-mono">+{setsCompleted * 2} pts</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>30+ Mins Duration Bonus</span>
                  <span className={durationMins >= 30 ? 'text-green-400 font-mono' : 'text-zinc-600 font-mono'}>
                    {durationMins >= 30 ? '+5 pts' : '0 pts'}
                  </span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                How It Works
              </h3>
              <ol className="space-y-3 text-xs text-zinc-400">
                <li className="flex gap-2">
                  <span className="font-mono text-red-500 font-bold">1.</span>
                  <span>Fill in the exercise you completed during your gym session.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-red-500 font-bold">2.</span>
                  <span>Your trainer reviews the queue in their Trainer HQ dashboard.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-red-500 font-bold">3.</span>
                  <span>Upon approval, points and badges are credited to your account!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
