'use client'

import { useState, useEffect, useMemo } from 'react'
import { getExerciseById, type Exercise } from '@/lib/exercisedb'
import { createClient } from '@/lib/supabase/client'
import { capitalize } from '@/lib/utils'
import Image from 'next/image'
import {
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Wind,
  Timer,
  AlertTriangle,
  Sparkles,
  X,
  ChevronRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

export interface RoutineExerciseLike {
  id?: string
  exercise_db_id: string
  exercise_name: string
  sets?: number
  reps?: string
  notes?: string | null
  gifUrl?: string | null
  day_label?: string
  order_index?: number
}

interface ExerciseDetailModalProps {
  exercise: RoutineExerciseLike
  index?: number
  trigger?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  onBookmarkChange?: (isBookmarked: boolean, exerciseDbId: string) => void
}

function getSafetyGuidelines(bodyPart?: string, equipment?: string) {
  const bp = (bodyPart || '').toLowerCase()
  const eq = (equipment || '').toLowerCase()

  let spineJoint = 'Maintain neutral cervical and lumbar spine alignment. Engage core bracing throughout the entire kinetic chain.'
  if (bp.includes('back') || bp.includes('leg') || bp.includes('waist')) {
    spineJoint = 'Maintain a neutral spine curvature. Hinge at hips with knees tracking over toes; never round the lower back under load.'
  } else if (bp.includes('chest') || bp.includes('shoulder')) {
    spineJoint = 'Retract and depress scapulae against the bench/pad. Avoid excessively flaring elbows beyond 75° to protect rotator cuffs.'
  } else if (bp.includes('arm')) {
    spineJoint = 'Keep wrists locked in a neutral alignment. Minimize torso momentum and elbow drifting to isolate target muscular fibers.'
  }

  let equipmentCheck = 'Inspect equipment condition and ensure weight collars or safety latches are properly locked before initiating sets.'
  if (eq.includes('barbell')) {
    equipmentCheck = 'Always secure weight plates with barbell collar clamps. Set safety spotter pins just below chest/hip range of motion.'
  } else if (eq.includes('dumbbell')) {
    equipmentCheck = 'Control the weight path on eccentric lowering. Set dumbbells down smoothly rather than dropping from shoulder lockout.'
  } else if (eq.includes('cable') || eq.includes('machine')) {
    equipmentCheck = 'Ensure selector pin is fully inserted into weight stack. Adjust seat/pad so joint axis of rotation matches machine pivot.'
  } else if (eq.includes('body')) {
    equipmentCheck = 'Focus on maximum muscular tension and joint control. Utilize regressional modifications if joint discomfort occurs.'
  }

  return {
    spineJoint,
    equipmentCheck,
    breathing: 'Inhale deeply into the diaphragm during the eccentric (lowering) phase. Exhale forcefully through pursed lips during peak concentric (lifting) effort.',
    tempo: 'Recommended 2-1-1 Tempo: 2 seconds controlled lowering, 1 second pause at peak contraction, and 1 second explosive concentric lift.',
  }
}

export function ExerciseDetailModal({
  exercise,
  index,
  trigger,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onBookmarkChange,
}: ExerciseDetailModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalOpen

  const [detail, setDetail] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const exerciseDbId = exercise.exercise_db_id

  // Load exercise detail when opened
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function fetchData() {
      if (!detail && exerciseDbId) {
        setLoading(true)
        try {
          const data = await getExerciseById(exerciseDbId)
          if (isMounted) setDetail(data)
        } catch {
          // graceful fallback with existing data
        } finally {
          if (isMounted) setLoading(false)
        }
      }

      // Check bookmark status for authenticated user
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted && exerciseDbId) {
          const { data: bookmarkRow } = (await supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', user.id)
            .eq('exercise_db_id', exerciseDbId)
            .maybeSingle()) as any

          if (isMounted) {
            setIsBookmarked(Boolean(bookmarkRow))
          }
        }
      } catch {
        // fail silently
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [isOpen, exerciseDbId, detail, supabase])

  function handleOpen() {
    if (!isControlled) {
      setInternalOpen(true)
    }
  }

  function handleClose() {
    if (isControlled && externalOnClose) {
      externalOnClose()
    } else {
      setInternalOpen(false)
    }
  }

  // One-click exercise bookmark toggle
  async function handleToggleBookmark(e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to bookmark exercises')
      return
    }

    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_db_id', exerciseDbId)

        if (error) throw error
        setIsBookmarked(false)
        onBookmarkChange?.(false, exerciseDbId)
        toast.success(`Removed "${exercise.exercise_name}" from bookmarks`)
      } else {
        const gif = detail?.gifUrl || exercise.gifUrl || null
        const { error } = await supabase.from('bookmarks').upsert({
          user_id: user.id,
          exercise_db_id: exerciseDbId,
          exercise_name: exercise.exercise_name,
          exercise_gif: gif,
        })

        if (error) throw error
        setIsBookmarked(true)
        onBookmarkChange?.(true, exerciseDbId)
        toast.success(`Bookmarked "${exercise.exercise_name}"! 🔖`, {
          description: 'Saved to your personal bookmark list for quick workout access.',
        })
      }
    } catch (err: any) {
      toast.error('Bookmark error: ' + (err.message || 'Failed to update bookmark'))
    } finally {
      setBookmarkLoading(false)
    }
  }

  const gifSource = detail?.gifUrl || exercise.gifUrl
  const safety = getSafetyGuidelines(detail?.bodyPart, detail?.equipment)

  return (
    <>
      {/* Trigger Rendering */}
      {trigger ? (
        <div onClick={handleOpen} className="cursor-pointer">
          {trigger}
        </div>
      ) : !isControlled ? (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/50 transition-colors text-left group border-b border-zinc-800/40 last:border-b-0"
        >
          {index !== undefined && (
            <div className="w-8 h-8 rounded-full bg-red-950/50 border border-red-800/30 flex items-center justify-center text-red-400 text-sm font-bold shrink-0 group-hover:border-red-600 transition-colors">
              {index + 1}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm capitalize group-hover:text-red-400 transition-colors truncate">
              {exercise.exercise_name}
            </p>
            {exercise.notes && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate italic">{exercise.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm shrink-0">
            {exercise.sets !== undefined && (
              <div className="text-center">
                <div className="font-black text-white">{exercise.sets}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">sets</div>
              </div>
            )}
            {exercise.sets !== undefined && exercise.reps !== undefined && (
              <div className="text-zinc-700 font-bold">×</div>
            )}
            {exercise.reps !== undefined && (
              <div className="text-center">
                <div className="font-black text-white">{exercise.reps}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">reps</div>
              </div>
            )}
            <ChevronRight size={16} className="text-zinc-700 group-hover:text-red-500 transition-colors" />
          </div>
        </button>
      ) : null}

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.9)] relative custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">
                    Exercise Intel
                  </span>
                  {detail?.target && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {detail.target}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white capitalize truncate">
                  {exercise.exercise_name}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* One-Click Bookmark Button */}
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  disabled={bookmarkLoading}
                  title={isBookmarked ? 'Remove Bookmark' : 'Add to Bookmarks'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
                    isBookmarked
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-yellow-400 hover:border-yellow-500/40 hover:bg-zinc-850'
                  }`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={15} className="text-yellow-400" />
                  ) : (
                    <Bookmark size={15} />
                  )}
                  <span className="hidden sm:inline">
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-10 h-10 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                    Fetching Exercise Demonstration & Safety Protocols...
                  </p>
                </div>
              ) : (
                <>
                  {/* Animated Exercise Demonstration GIF */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 h-64 sm:h-72 flex items-center justify-center shadow-inner group">
                    {gifSource ? (
                      <Image
                        src={gifSource}
                        alt={exercise.exercise_name}
                        fill
                        unoptimized
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <span className="text-5xl block">💪</span>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                          Technical Visual Demonstration
                        </p>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-red-400" />
                      Visual Cadence Guide
                    </div>
                  </div>

                  {/* Muscle Tags & Equipment */}
                  <div className="flex flex-wrap gap-2">
                    {detail ? (
                      [
                        { label: detail.bodyPart, type: 'Target Group' },
                        { label: detail.target, type: 'Prime Mover' },
                        { label: detail.equipment, type: 'Equipment' },
                      ].map((tag, i) => (
                        <div
                          key={i}
                          className="px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center gap-1.5 capitalize"
                        >
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">
                            {tag.type}:
                          </span>
                          <span className="text-white font-bold">{tag.label}</span>
                        </div>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 capitalize">
                        Gym Exercise
                      </span>
                    )}
                  </div>

                  {/* Sets / Reps Target Split (if available) */}
                  {(exercise.sets !== undefined || exercise.reps !== undefined) && (
                    <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/70">
                      <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-white">{exercise.sets || '—'}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                          Assigned Sets
                        </div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-white">{exercise.reps || '—'}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                          Target Reps
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Technique & Safety Guidelines ──────────────────────── */}
                  <div className="bg-gradient-to-br from-red-950/20 via-zinc-900/60 to-zinc-950 border border-red-900/30 rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center gap-2 text-red-400 border-b border-red-900/20 pb-2.5">
                      <ShieldCheck size={18} className="text-red-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        Technique & Safety Guidelines
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3.5 text-xs">
                      {/* Joint Mechanics */}
                      <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[10px] tracking-wider">
                          <AlertTriangle size={12} />
                          Joint & Spine Alignment
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">
                          {safety.spineJoint}
                        </p>
                      </div>

                      {/* Breathing Cadence */}
                      <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                          <Wind size={12} />
                          Breathing Cadence
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">
                          {safety.breathing}
                        </p>
                      </div>

                      {/* Tempo */}
                      <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                          <Timer size={12} />
                          Time Under Tension
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">
                          {safety.tempo}
                        </p>
                      </div>

                      {/* Equipment Safety */}
                      <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                          <Info size={12} />
                          Safety Checklist
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">
                          {safety.equipmentCheck}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Execution Instructions */}
                  {detail && detail.instructions && detail.instructions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                        Execution Instructions
                      </h3>
                      <ol className="space-y-2.5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
                        {detail.instructions.map((step, i) => (
                          <li key={i} className="flex gap-3 text-xs text-zinc-300 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{capitalize(step)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Secondary Muscle Synergists */}
                  {detail && detail.secondaryMuscles && detail.secondaryMuscles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase mb-2">
                        Synergist & Stabilizer Muscles
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.secondaryMuscles.map((m, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-red-950/20 border border-red-800/30 text-xs text-red-400 rounded-lg capitalize font-medium"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coach / Trainer Notes */}
                  {exercise.notes && (
                    <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <Info size={13} />
                        Coach Execution Note
                      </div>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        &quot;{exercise.notes}&quot;
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
