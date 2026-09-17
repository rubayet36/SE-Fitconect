'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clientSearchExercises, type Exercise } from '@/lib/exercisedb'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Dumbbell,
  Zap,
  CheckCircle2,
  Search,
  UserCheck,
  Layers,
  Clock,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Activity,
  Flame,
  Award,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react'

interface TrainerOption {
  id: string
  full_name: string
  email?: string
  avatar_url?: string | null
  is_assigned?: boolean
}

export default function LogExercisePage() {
  const supabase = useMemo(() => createClient(), [])

  // Trainer state
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [loadingTrainers, setLoadingTrainers] = useState(true)
  const [selectedTrainerId, setSelectedTrainerId] = useState('')

  // Form inputs
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseDbId, setExerciseDbId] = useState<string | null>(null)
  const [selectedExerciseMeta, setSelectedExerciseMeta] = useState<Exercise | null>(null)
  const [setsCompleted, setSetsCompleted] = useState<number>(3)
  const [repsCompleted, setRepsCompleted] = useState<string>('10')
  const [durationMins, setDurationMins] = useState<number>(30)
  const [notes, setNotes] = useState<string>('')

  // Search state for ExerciseDB
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submittedLog, setSubmittedLog] = useState<{
    id: string
    exercise_name: string
    sets: number
    reps: string
    duration: number
    estimated_points: number
    trainer_name: string
  } | null>(null)

  // ── 1. Load Member's Trainers ──────────────────────────────────────────
  useEffect(() => {
    async function loadTrainers() {
      try {
        setLoadingTrainers(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Step A: Check for trainers in member's requests
        const { data: requestRows } = await supabase
          .from('requests')
          .select('trainer_id, profiles!requests_trainer_id_fkey(id, full_name, email, avatar_url)')
          .eq('member_id', user.id)

        // Step B: Load all registered trainers in profiles as fallback/complete list
        const { data: allTrainerRows } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('role', 'trainer')
          .order('full_name', { ascending: true })

        const assignedTrainerMap = new Map<string, TrainerOption>()
        if (requestRows) {
          for (const req of requestRows) {
            const prof = req.profiles as any
            if (prof && prof.id) {
              assignedTrainerMap.set(prof.id, {
                id: prof.id,
                full_name: prof.full_name || 'Personal Trainer',
                email: prof.email,
                avatar_url: prof.avatar_url,
                is_assigned: true,
              })
            }
          }
        }

        const combinedList: TrainerOption[] = []
        // First add assigned trainers
        assignedTrainerMap.forEach((tr) => combinedList.push(tr))

        // Then add other trainers
        if (allTrainerRows) {
          for (const tr of allTrainerRows) {
            if (!assignedTrainerMap.has(tr.id)) {
              combinedList.push({
                id: tr.id,
                full_name: tr.full_name || tr.email || 'Trainer',
                email: tr.email,
                avatar_url: tr.avatar_url,
                is_assigned: false,
              })
            }
          }
        }

        setTrainers(combinedList)
        if (combinedList.length > 0) {
          setSelectedTrainerId(combinedList[0].id)
        }
      } catch (err) {
        console.error('Failed to load trainers:', err)
        toast.error('Failed to load trainer list')
      } finally {
        setLoadingTrainers(false)
      }
    }

    loadTrainers()
  }, [supabase])

  // ── 2. Debounced ExerciseDB Search ────────────────────────────────────
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(async () => {
      try {
        const results = await clientSearchExercises(searchQuery.trim(), 8)
        setSearchResults(results)
        setDropdownOpen(true)
      } catch (err) {
        console.error('Error querying exercises:', err)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle exercise selection
  const handleSelectExercise = (exercise: Exercise) => {
    setExerciseName(exercise.name)
    setExerciseDbId(exercise.id)
    setSelectedExerciseMeta(exercise)
    setSearchQuery('')
    setDropdownOpen(false)
  }

  // Handle clearing selected exercise
  const handleClearSelectedExercise = () => {
    setExerciseName('')
    setExerciseDbId(null)
    setSelectedExerciseMeta(null)
  }

  // ── 3. Estimated Points Calculation ──────────────────────────────────
  // Formula: Base 10 + (sets * 2) + (duration >= 30m ? 5 : 0)
  const basePoints = 10
  const setsBonus = (Math.max(1, setsCompleted) || 1) * 2
  const durationBonus = (Number(durationMins) || 0) >= 30 ? 5 : 0
  const totalEstimatedPoints = basePoints + setsBonus + durationBonus

  // ── 4. Form Submission ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const finalExerciseName = exerciseName.trim() || searchQuery.trim()

    if (!selectedTrainerId) {
      toast.error('Please select a trainer to review your exercise')
      return
    }
    if (!finalExerciseName) {
      toast.error('Please specify or search for an exercise name')
      return
    }
    if (setsCompleted < 1) {
      toast.error('Sets completed must be at least 1')
      return
    }
    if (!repsCompleted.trim()) {
      toast.error('Please specify reps completed (e.g., 10 or 10-12)')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/gamification/log-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: selectedTrainerId,
          exercise_name: finalExerciseName,
          exercise_db_id: exerciseDbId || null,
          sets_completed: setsCompleted,
          reps_completed: repsCompleted.trim(),
          duration_mins: durationMins ? Number(durationMins) : null,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit workout log')
      }

      const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId)
      setSubmittedLog({
        id: data.data?.id || 'log-success',
        exercise_name: finalExerciseName,
        sets: setsCompleted,
        reps: repsCompleted.trim(),
        duration: durationMins || 0,
        estimated_points: totalEstimatedPoints,
        trainer_name: selectedTrainer?.full_name || 'Your Trainer',
      })

      toast.success('Exercise logged successfully!', {
        description: `Your trainer will review it. You could earn ~${totalEstimatedPoints} points!`,
      })
    } catch (err: any) {
      console.error('Submission error:', err)
      toast.error(err.message || 'Something went wrong while submitting your log')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setSubmittedLog(null)
    setExerciseName('')
    setExerciseDbId(null)
    setSelectedExerciseMeta(null)
    setSearchQuery('')
    setSetsCompleted(3)
    setRepsCompleted('10')
    setDurationMins(30)
    setNotes('')
  }

  // ── Success State View ───────────────────────────────────────────────
  if (submittedLog) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slide-up">
        {/* Celebration Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-green-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Glowing Ambient Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-green-500/20 to-emerald-500/30 border border-green-500/40 flex items-center justify-center text-4xl shadow-lg shadow-green-500/20">
            💪
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/40">
              <CheckCircle2 size={13} /> Workout Logged Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Great Session!
            </h1>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Your workout log has been submitted to <span className="text-white font-bold">{submittedLog.trainer_name}</span> for verification.
            </p>
          </div>

          {/* Reward Preview Highlight Box */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 max-w-md mx-auto flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs uppercase font-bold text-amber-400/90 tracking-wider">Potential Reward</p>
              <p className="text-xs text-zinc-400">Upon trainer approval</p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 rounded-xl">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="text-lg font-black text-amber-300">~{submittedLog.estimated_points} pts</span>
            </div>
          </div>

          {/* Summary Details */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-zinc-500 font-medium">Exercise</p>
              <p className="text-white font-bold truncate mt-0.5">{submittedLog.exercise_name}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Volume</p>
              <p className="text-white font-bold mt-0.5">{submittedLog.sets} × {submittedLog.reps}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Duration</p>
              <p className="text-white font-bold mt-0.5">{submittedLog.duration ? `${submittedLog.duration}m` : '—'}</p>
            </div>
          </div>

          {/* Navigation & Reset Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Log Another Exercise
            </button>
            <Link
              href="/member/activity-log"
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Activity size={14} className="text-red-400" /> View Activity History <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Form View ───────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Log Your Workout
              </h1>
              <p className="text-xs lg:text-sm text-zinc-400 mt-0.5">
                Submit your sets, reps, and exercise details to your trainer for point verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/member/activity-log"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-red-400" /> My Logs History
          </Link>
          <Link
            href="/member/leaderboard"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-yellow-500" /> Leaderboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: The Submission Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Choose Reviewing Trainer */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <UserCheck size={16} className="text-red-500" />
                1. Select Assigned Trainer
              </label>

              {loadingTrainers ? (
                <div className="py-3 text-xs text-zinc-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-red-500" />
                  Loading trainers...
                </div>
              ) : trainers.length === 0 ? (
                <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-xl text-xs text-red-300">
                  No registered trainers found. You will still be able to submit once a trainer is added.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {trainers.map((t) => {
                    const isSelected = selectedTrainerId === t.id
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setSelectedTrainerId(t.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-red-950/30 border-red-500/80 text-white shadow-md shadow-red-950/40 ring-1 ring-red-500/50'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {t.full_name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{t.full_name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {t.is_assigned ? '⭐ Your Assigned Trainer' : 'Fitness Coach'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 2: ExerciseDB Real-Time Search & Selection */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Dumbbell size={16} className="text-red-500" />
                  2. Exercise Name
                </label>
                <span className="text-[10px] text-zinc-500">Search ExerciseDB or enter custom</span>
              </div>

              {/* Selected Exercise Banner */}
              {selectedExerciseMeta ? (
                <div className="bg-gradient-to-r from-red-950/30 via-zinc-900 to-zinc-950 border border-red-500/40 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{selectedExerciseMeta.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 capitalize">
                        {selectedExerciseMeta.bodyPart}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 capitalize">
                        {selectedExerciseMeta.equipment}
                      </span>
                    </div>
                    {selectedExerciseMeta.target && (
                      <p className="text-[10px] text-zinc-400">
                        Target: <span className="text-zinc-300 capitalize">{selectedExerciseMeta.target}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedExercise}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Change exercise"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={searchDropdownRef}>
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery || exerciseName}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setExerciseName(e.target.value)
                        setExerciseDbId(null)
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setDropdownOpen(true)
                      }}
                      placeholder="Search 800+ exercises (e.g. Bench Press, Squat, Lat Pulldown)..."
                      className="w-full pl-10 pr-10 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition-all"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-red-500 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {dropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 max-h-64 overflow-y-auto">
                      <div className="p-2 bg-zinc-900/40 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                        ExerciseDB Matches ({searchResults.length})
                      </div>
                      {searchResults.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => handleSelectExercise(exercise)}
                          className="w-full text-left p-3 hover:bg-zinc-900/80 transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-zinc-200 group-hover:text-red-400 transition-colors capitalize truncate">
                              {exercise.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 capitalize">
                              {exercise.bodyPart} • {exercise.equipment}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Popular Exercise Quick Tags */}
              {!selectedExerciseMeta && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Popular Quick Picks:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Pull Ups', 'Overhead Press', 'Dumbbell Curl'].map((quickName) => (
                      <button
                        key={quickName}
                        type="button"
                        onClick={() => {
                          setExerciseName(quickName)
                          setSearchQuery('')
                          setExerciseDbId(null)
                        }}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                          exerciseName === quickName
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {quickName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Performance Metrics (Sets, Reps, Duration) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 space-y-5">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Layers size={16} className="text-red-500" />
                3. Workout Metrics & Sets
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sets Completed */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>Sets Completed</span>
                    <span className="text-red-400 font-bold">+{setsCompleted * 2} pts</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSetsCompleted((s) => Math.max(1, s - 1))}
                      className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-l-xl text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center font-black"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={setsCompleted}
                      onChange={(e) => setSetsCompleted(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2.5 bg-zinc-900 border-y border-zinc-800 text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSetsCompleted((s) => Math.min(20, s + 1))}
                      className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-r-xl text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Reps Completed */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400">Reps (or range)</label>
                  <input
                    type="text"
                    value={repsCompleted}
                    onChange={(e) => setRepsCompleted(e.target.value)}
                    placeholder="e.g. 10 or 12, 10, 8"
                    required
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40"
                  />
                  {/* Preset chips */}
                  <div className="flex gap-1 pt-0.5">
                    {['8-10', '10-12', '12-15'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRepsCompleted(r)}
                        className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>Duration (mins)</span>
                    {durationMins >= 30 && <span className="text-amber-400 font-bold text-[10px]">+5 pts bonus</span>}
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={durationMins}
                      onChange={(e) => setDurationMins(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40"
                    />
                  </div>
                  {/* Duration presets */}
                  <div className="flex gap-1 pt-0.5">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMins(mins)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                          durationMins === mins
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Workout Notes */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <FileText size={16} className="text-red-500" />
                4. Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your progress, weights lifted (e.g. 70kg), RPE, or tempo notes with your trainer..."
                rows={3}
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-green-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Log to Trainer...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                  Submit Exercise Log 🚀
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Live Points Estimator & Info Cards */}
        <div className="space-y-6">
          {/* Estimated Points Card */}
          <div className="bg-gradient-to-b from-zinc-950 to-zinc-900 border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Estimated Points
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Gamification Reward
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
              <div className="text-4xl font-black text-amber-400 flex items-center justify-center gap-2">
                <Zap className="w-7 h-7 fill-amber-400 animate-bounce" />
                ~{totalEstimatedPoints} <span className="text-lg font-bold text-amber-200">pts</span>
              </div>
              <p className="text-[11px] text-zinc-400">Awarded automatically upon trainer approval</p>
            </div>

            {/* Formula Breakdown */}
            <div className="space-y-2.5 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Points Calculation Breakdown</p>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-500" /> Base Completion
                </span>
                <span className="font-bold text-white">+{basePoints} pts</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-red-400" /> {setsCompleted} Sets × 2 pts
                </span>
                <span className="font-bold text-white">+{setsBonus} pts</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" /> Duration (≥ 30 mins)
                </span>
                <span className={`font-bold ${durationBonus > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {durationBonus > 0 ? `+${durationBonus} pts` : '0 pts'}
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Milestone Tip Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Award size={15} className="text-yellow-500" />
              How Approvals Work
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">1.</span>
                Submit your workout log after finishing your training session.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">2.</span>
                Your designated trainer reviews the log in their approval queue.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">3.</span>
                Once approved, points are instantly credited and your leaderboard ranking updates!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
