'use client'

import { useState } from 'react'
import { getExerciseById, type Exercise } from '@/lib/exercisedb'
import { capitalize } from '@/lib/utils'
import Image from 'next/image'

interface RoutineRow {
  id: string
  exercise_db_id: string
  exercise_name: string
  sets: number
  reps: string
  notes: string | null
  day_label: string
  order_index: number
  member_id: string
  trainer_id: string
  created_at: string
}

interface ExerciseDetailModalProps {
  exercise: RoutineRow
  index: number
}

export function ExerciseDetailModal({ exercise, index }: ExerciseDetailModalProps) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)

  async function openModal() {
    setOpen(true)
    if (!detail) {
      setLoading(true)
      try {
        const data = await getExerciseById(exercise.exercise_db_id)
        setDetail(data)
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/50 transition-colors text-left group"
      >
        <div className="w-8 h-8 rounded-full bg-red-950/50 border border-red-800/30 flex items-center justify-center text-red-400 text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm capitalize group-hover:text-red-400 transition-colors">
            {exercise.exercise_name}
          </p>
          {exercise.notes && (
            <p className="text-xs text-zinc-600 mt-0.5 truncate">{exercise.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm shrink-0">
          <div className="text-center">
            <div className="font-black text-white">{exercise.sets}</div>
            <div className="text-xs text-zinc-600">sets</div>
          </div>
          <div className="text-zinc-700">×</div>
          <div className="text-center">
            <div className="font-black text-white">{exercise.reps}</div>
            <div className="text-xs text-zinc-600">reps</div>
          </div>
          <span className="text-zinc-700 group-hover:text-red-500 transition-colors">›</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-black text-white capitalize">{exercise.exercise_name}</h2>
                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : detail ? (
                <div className="space-y-5">
                  {/* GIF */}
                  {detail.gifUrl && (
                    <div className="relative rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center h-48">
                      <Image src={detail.gifUrl} alt={detail.name} fill unoptimized className="object-contain" />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {[detail.bodyPart, detail.target, detail.equipment].map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 rounded-full capitalize">
                        {String(tag)}
                      </span>
                    ))}
                  </div>

                  {/* Sets/Reps */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-white">{exercise.sets}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Sets</div>
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-white">{exercise.reps}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Reps</div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {detail.instructions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase mb-3">Instructions</h3>
                      <ol className="space-y-2">
                        {detail.instructions.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-zinc-400">
                            <span className="text-red-500 font-bold shrink-0">{i + 1}.</span>
                            <span>{capitalize(step)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Secondary Muscles */}
                  {detail.secondaryMuscles?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase mb-2">Secondary Muscles</h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.secondaryMuscles.map((m, i) => (
                          <span key={i} className="px-2.5 py-1 bg-red-950/30 border border-red-800/30 text-xs text-red-400 rounded-full capitalize">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trainer Notes */}
                  {exercise.notes && (
                    <div className="bg-yellow-950/20 border border-yellow-800/30 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-1">Trainer Notes</h3>
                      <p className="text-sm text-zinc-300">{exercise.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-48 bg-zinc-900 rounded-xl flex items-center justify-center text-5xl">
                    💪
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-white">{exercise.sets}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Sets</div>
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-white">{exercise.reps}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Reps</div>
                    </div>
                  </div>
                  {exercise.notes && (
                    <div className="bg-yellow-950/20 border border-yellow-800/30 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-1">Trainer Notes</h3>
                      <p className="text-sm text-zinc-300">{exercise.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
