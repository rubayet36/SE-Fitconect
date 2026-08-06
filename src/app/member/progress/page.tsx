'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TrendingUp, Plus, Dumbbell, Activity, Calendar, Trophy, Trash2, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react'

interface BodyMetric {
  id: string
  recorded_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  chest_cm: number | null
  waist_cm: number | null
  biceps_cm: number | null
  notes: string | null
}

interface WorkoutLog {
  id: string
  logged_at: string
  exercise_name: string
  sets_completed: number
  reps_completed: string
  weight_kg: number | null
  is_pr: boolean
  notes: string | null
}

export default function MemberProgressPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'metrics' | 'workouts'>('metrics')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [showMetricModal, setShowMetricModal] = useState(false)
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)

  // Form states - Metrics
  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPct, setBodyFatPct] = useState('')
  const [chestCm, setChestCm] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [bicepsCm, setBicepsCm] = useState('')
  const [metricNotes, setMetricNotes] = useState('')

  // Form states - Workouts
  const [exerciseName, setExerciseName] = useState('')
  const [setsCompleted, setSetsCompleted] = useState('3')
  const [repsCompleted, setRepsCompleted] = useState('10')
  const [workoutWeightKg, setWorkoutWeightKg] = useState('')
  const [isPr, setIsPr] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [metricsRes, workoutsRes] = await Promise.all([
        supabase
          .from('member_body_metrics')
          .select('*')
          .eq('member_id', user.id)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('member_workout_logs')
          .select('*')
          .eq('member_id', user.id)
          .order('logged_at', { ascending: false })
      ])

      if (metricsRes.data) setMetrics(metricsRes.data)
      if (workoutsRes.data) setWorkouts(workoutsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMetric(e: React.FormEvent) {
    e.preventDefault()
    if (!weightKg && !bodyFatPct) {
      toast.error('Please enter at least Weight or Body Fat %')
      return
    }

    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User authentication required')
        return
      }

      const { error } = await supabase.from('member_body_metrics').insert({
        member_id: user.id,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
        chest_cm: chestCm ? parseFloat(chestCm) : null,
        waist_cm: waistCm ? parseFloat(waistCm) : null,
        biceps_cm: bicepsCm ? parseFloat(bicepsCm) : null,
        notes: metricNotes || null,
        recorded_at: new Date().toISOString()
      })

      if (error) throw error

      toast.success('Body metric logged successfully!')
      setShowMetricModal(false)
      setWeightKg('')
      setBodyFatPct('')
      setChestCm('')
      setWaistCm('')
      setBicepsCm('')
      setMetricNotes('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save log')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddWorkout(e: React.FormEvent) {
    e.preventDefault()
    if (!exerciseName.trim()) {
      toast.error('Please enter an exercise name')
      return
    }

    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('member_workout_logs').insert({
        member_id: user.id,
        exercise_name: exerciseName.trim(),
        sets_completed: parseInt(setsCompleted) || 1,
        reps_completed: repsCompleted || '10',
        weight_kg: workoutWeightKg ? parseFloat(workoutWeightKg) : null,
        is_pr: isPr,
        notes: workoutNotes || null,
        logged_at: new Date().toISOString()
      })

      if (error) throw error

      toast.success('Workout log saved!')
      setShowWorkoutModal(false)
      setExerciseName('')
      setWorkoutWeightKg('')
      setIsPr(false)
      setWorkoutNotes('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workout log')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteMetric(id: string) {
    try {
      const { error } = await supabase.from('member_body_metrics').delete().eq('id', id)
      if (error) throw error
      toast.success('Log removed')
      setMetrics(prev => prev.filter(m => m.id !== id))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDeleteWorkout(id: string) {
    try {
      const { error } = await supabase.from('member_workout_logs').delete().eq('id', id)
      if (error) throw error
      toast.success('Workout log removed')
      setWorkouts(prev => prev.filter(w => w.id !== id))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Calculate trends & SVG Points
  const latestMetric = metrics[metrics.length - 1]
  const firstMetric = metrics[0]
  const weightChange = (latestMetric?.weight_kg && firstMetric?.weight_kg)
    ? (latestMetric.weight_kg - firstMetric.weight_kg).toFixed(1)
    : null

  // Graph point calculations for weight
  const validWeightMetrics = metrics.filter(m => m.weight_kg !== null)
  const minWeight = Math.min(...validWeightMetrics.map(m => m.weight_kg!), 50)
  const maxWeight = Math.max(...validWeightMetrics.map(m => m.weight_kg!), 100)
  const weightRange = Math.max(maxWeight - minWeight, 5)

  const prLogs = workouts.filter(w => w.is_pr)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Analytics & Log History</p>
          <h1 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
            <TrendingUp className="text-red-500" /> Progress Hub
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMetricModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,29,0.3)]"
          >
            <Plus size={16} /> Log Weight/Metrics
          </button>

          <button
            onClick={() => setShowWorkoutModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all"
          >
            <Plus size={16} /> Log Workout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'metrics'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Scale size={16} className="inline mr-2" /> Body Metrics & Weight Chart
        </button>

        <button
          onClick={() => setActiveTab('workouts')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'workouts'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Dumbbell size={16} className="inline mr-2" /> Workout Logs & PRs ({workouts.length})
        </button>
      </div>

      {/* BODY METRICS TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Current Weight</span>
              <div className="text-2xl font-black text-white mt-1">
                {latestMetric?.weight_kg ? `${latestMetric.weight_kg} kg` : '—'}
              </div>
              {weightChange !== null && (
                <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                  parseFloat(weightChange) <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {parseFloat(weightChange) <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {Math.abs(parseFloat(weightChange))} kg total change
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Body Fat %</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {latestMetric?.body_fat_pct ? `${latestMetric.body_fat_pct}%` : '—'}
              </div>
              <p className="text-xs text-zinc-600 mt-1">Latest measurement</p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Biceps / Chest</span>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {latestMetric?.biceps_cm ? `${latestMetric.biceps_cm} cm` : '—'}
              </div>
              <p className="text-xs text-zinc-600 mt-1">Chest: {latestMetric?.chest_cm ? `${latestMetric.chest_cm} cm` : '—'}</p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Logs</span>
              <div className="text-2xl font-black text-red-400 mt-1">{metrics.length}</div>
              <p className="text-xs text-zinc-600 mt-1">Recorded entries</p>
            </div>
          </div>

          {/* SVG Weight Progression Chart */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-white text-lg">Weight Trend</h2>
                <p className="text-xs text-zinc-500">Historical weight progression chart</p>
              </div>
              <div className="text-xs px-3 py-1 bg-red-950/40 border border-red-800/30 text-red-400 rounded-full font-semibold">
                {validWeightMetrics.length} data points
              </div>
            </div>

            {validWeightMetrics.length < 2 ? (
              <div className="py-12 text-center text-zinc-600 text-sm">
                Add at least 2 weight entries to generate your visual progress chart.
              </div>
            ) : (
              <div className="relative h-56 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#27272a" strokeDasharray="3 3" />

                  {/* Gradient Area Fill */}
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Polyline Path */}
                  {(() => {
                    const points = validWeightMetrics.map((m, idx) => {
                      const x = (idx / (validWeightMetrics.length - 1)) * 480 + 10
                      const y = 130 - ((m.weight_kg! - minWeight) / weightRange) * 110
                      return { x, y, weight: m.weight_kg, date: new Date(m.recorded_at).toLocaleDateString() }
                    })

                    const pathString = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
                    const areaString = `${pathString} L ${points[points.length - 1].x} 145 L ${points[0].x} 145 Z`

                    return (
                      <>
                        <path d={areaString} fill="url(#weightGrad)" />
                        <path d={pathString} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5" fill="#ef4444" className="transition-transform group-hover:scale-150" />
                            <title>{`${p.weight} kg on ${p.date}`}</title>
                          </g>
                        ))}
                      </>
                    )
                  })()}
                </svg>
              </div>
            )}
          </div>

          {/* Metrics History Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-black text-white">Metrics Log History</h2>
            </div>
            {metrics.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No body metrics logged yet. Click "Log Weight/Metrics" to get started!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Weight (kg)</th>
                      <th className="px-6 py-3">Body Fat %</th>
                      <th className="px-6 py-3">Chest / Waist / Biceps</th>
                      <th className="px-6 py-3">Notes</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {metrics.slice().reverse().map(m => (
                      <tr key={m.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-medium">
                          {new Date(m.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {m.weight_kg ? `${m.weight_kg} kg` : '—'}
                        </td>
                        <td className="px-6 py-4 text-amber-400 font-semibold">
                          {m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {m.chest_cm && <span>C: {m.chest_cm}cm </span>}
                          {m.waist_cm && <span>W: {m.waist_cm}cm </span>}
                          {m.biceps_cm && <span>B: {m.biceps_cm}cm</span>}
                          {!m.chest_cm && !m.waist_cm && !m.biceps_cm && '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-xs truncate max-w-xs">{m.notes || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMetric(m.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKOUT LOGS TAB */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          {/* PR Highlights */}
          {prLogs.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-amber-950/30 to-zinc-950 border border-amber-900/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Trophy size={18} /> Personal Records (PRs)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {prLogs.map(pr => (
                  <div key={pr.id} className="p-3 bg-zinc-900/80 border border-amber-900/40 rounded-xl">
                    <div className="text-xs text-zinc-400 font-semibold">{pr.exercise_name}</div>
                    <div className="text-xl font-black text-amber-400 mt-1">
                      {pr.weight_kg ? `${pr.weight_kg} kg` : `${pr.sets_completed} sets`}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{pr.sets_completed} sets × {pr.reps_completed} reps</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workout Logs History Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="font-black text-white">Workout Log History</h2>
            </div>

            {workouts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No workout sessions logged yet. Click "Log Workout" above to record your sets!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Exercise</th>
                      <th className="px-6 py-3">Sets × Reps</th>
                      <th className="px-6 py-3">Weight Lifted</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {workouts.map(w => (
                      <tr key={w.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs">
                          {new Date(w.logged_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">{w.exercise_name}</td>
                        <td className="px-6 py-4 text-zinc-300">{w.sets_completed} × {w.reps_completed}</td>
                        <td className="px-6 py-4 font-bold text-red-400">
                          {w.weight_kg ? `${w.weight_kg} kg` : 'Bodyweight'}
                        </td>
                        <td className="px-6 py-4">
                          {w.is_pr ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                              <Trophy size={12} /> PR Logged
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">Completed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteWorkout(w.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* METRIC MODAL */}
      {showMetricModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-black text-white">Log Body Metrics</h2>
            <form onSubmit={handleAddMetric} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase">Body Fat % (Optional)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15.2"
                  value={bodyFatPct}
                  onChange={e => setBodyFatPct(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="100"
                    value={chestCm}
                    onChange={e => setChestCm(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="82"
                    value={waistCm}
                    onChange={e => setWaistCm(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase">Biceps (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="38"
                    value={bicepsCm}
                    onChange={e => setBicepsCm(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Morning fasting weight"
                  value={metricNotes}
                  onChange={e => setMetricNotes(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMetricModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKOUT MODAL */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-black text-white">Log Workout Session</h2>
            <form onSubmit={handleAddWorkout} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bench Press, Squat, Pull-ups"
                  value={exerciseName}
                  onChange={e => setExerciseName(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Sets</label>
                  <input
                    type="number"
                    value={setsCompleted}
                    onChange={e => setSetsCompleted(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Reps</label>
                  <input
                    type="text"
                    placeholder="10"
                    value={repsCompleted}
                    onChange={e => setRepsCompleted(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="80"
                    value={workoutWeightKg}
                    onChange={e => setWorkoutWeightKg(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrCheckbox"
                  checked={isPr}
                  onChange={e => setIsPr(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <label htmlFor="isPrCheckbox" className="text-sm font-semibold text-amber-400 flex items-center gap-1 cursor-pointer">
                  <Trophy size={14} /> Personal Record (PR)?
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Felt strong on last set"
                  value={workoutNotes}
                  onChange={e => setWorkoutNotes(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
