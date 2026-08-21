'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { searchExercises, getBodyParts, getExercisesByBodyPart, getEquipmentList, getExercisesByEquipment, type Exercise } from '@/lib/exercisedb'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Search, Plus, Trash2, Save, ChevronDown, ChevronUp,
  Dumbbell, Info, X, Filter, User, Layers,
  GripVertical, BookOpen, Target, Zap, CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DayExercise {
  tempId: string
  exercise: Exercise
  sets: number
  reps: string
  notes: string
}

interface DayPlan {
  [day: string]: DayExercise[]
}

const DEFAULT_DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']

// ─────────────────────────────────────────────
// Exercise Detail Modal (with GIF + instructions)
// ─────────────────────────────────────────────

function ExercisePreviewModal({ exercise, onClose, onAdd }: {
  exercise: Exercise
  onClose: () => void
  onAdd?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* GIF / Image */}
        <div className="relative bg-zinc-900 rounded-t-3xl overflow-hidden h-52 flex items-center justify-center">
          {exercise.gifUrl ? (
            <Image src={exercise.gifUrl} alt={exercise.name} fill unoptimized className="object-contain" />
          ) : (
            <div className="text-6xl">💪</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/80 transition-all"
          >
            <X size={16} />
          </button>
          {exercise.images && exercise.images.length > 1 && (
            <div className="absolute bottom-3 right-3 text-[10px] bg-black/60 text-zinc-400 px-2 py-1 rounded-full">
              {exercise.images.length} images
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <h2 className="text-xl font-black text-white capitalize leading-tight">{exercise.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: exercise.bodyPart, color: 'bg-red-500/15 text-red-400 border-red-500/30' },
                { label: exercise.target, color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
                { label: exercise.equipment, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
              ].map((tag, i) => (
                <span key={i} className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${tag.color}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          {/* Secondary muscles */}
          {exercise.secondaryMuscles?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Target size={10} /> Secondary Muscles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 rounded-full capitalize">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* All images strip */}
          {exercise.images && exercise.images.length > 1 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Layers size={10} /> Demonstration
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {exercise.images.slice(0, 4).map((img, i) => (
                  <div key={i} className="relative w-24 h-20 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800">
                    <Image src={img} alt={`step ${i + 1}`} fill unoptimized className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BookOpen size={10} /> Step-by-Step Instructions
              </p>
              <ol className="space-y-2">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-400 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Add button */}
          {onAdd && (
            <button
              onClick={() => { onAdd(); onClose() }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Add to Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Exercise Library Card
// ─────────────────────────────────────────────

function ExerciseLibraryCard({ exercise, onAdd, onPreview }: {
  exercise: Exercise
  onAdd: () => void
  onPreview: () => void
}) {
  return (
    <div className="group flex gap-3 p-3 border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-all">
      <button
        onClick={onPreview}
        className="relative w-14 h-14 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800 hover:border-zinc-600 transition-all"
        title="Preview exercise"
      >
        {exercise.gifUrl ? (
          <Image src={exercise.gifUrl} alt={exercise.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl text-zinc-700">💪</div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
          <Info size={14} className="text-white" />
        </div>
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={onPreview} className="text-left w-full">
          <p className="text-xs font-bold text-white capitalize leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
            {exercise.name}
          </p>
        </button>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-zinc-600 capitalize bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {exercise.bodyPart}
          </span>
          <span className="text-[10px] text-zinc-700 capitalize">
            {exercise.equipment}
          </span>
        </div>
      </div>

      <button
        onClick={onAdd}
        title="Add to plan"
        className="shrink-0 w-8 h-8 bg-red-600/15 border border-red-700/30 rounded-xl text-red-400
          hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center
          lg:opacity-0 lg:group-hover:opacity-100 opacity-100"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Plan Exercise Row
// ─────────────────────────────────────────────

function PlanExerciseRow({ item, day, index, onRemove, onUpdate, onPreview }: {
  item: DayExercise
  day: string
  index: number
  onRemove: () => void
  onUpdate: (field: keyof Omit<DayExercise, 'tempId' | 'exercise'>, value: string | number) => void
  onPreview: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="group bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <GripVertical size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors cursor-grab" />
          <span className="text-[10px] text-zinc-700 font-bold">{index + 1}</span>
        </div>

        <button onClick={onPreview} className="relative w-11 h-11 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800 hover:border-red-700/50 transition-all">
          {item.exercise.gifUrl ? (
            <Image src={item.exercise.gifUrl} alt={item.exercise.name} fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">💪</div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white capitalize truncate">{item.exercise.name}</p>
          <p className="text-[10px] text-zinc-600 capitalize mt-0.5">{item.exercise.bodyPart}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
          <span className="font-black text-white">{item.sets}</span>
          <span className="text-zinc-700">×</span>
          <span className="font-black text-white">{item.reps}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-zinc-900 transition-all shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-950/20 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800/60 p-3 space-y-3 bg-zinc-900/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Sets</label>
              <input
                type="number" min={1} max={20} value={item.sets}
                onChange={e => onUpdate('sets', parseInt(e.target.value) || 1)}
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Reps</label>
              <input
                type="text" placeholder="e.g. 10 or 8-12" value={item.reps}
                onChange={e => onUpdate('reps', e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold flex items-center gap-1">
              <Zap size={10} /> Coach Execution Notes
            </label>
            <input
              type="text" placeholder="e.g. Keep core tight, slow eccentric…" value={item.notes}
              onChange={e => onUpdate('notes', e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Inner Component
// ─────────────────────────────────────────────

function WorkoutBuilderInner() {
  const searchParams = useSearchParams()
  const preselectedMemberId = searchParams.get('member') || ''
  const supabase = createClient()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('chest')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [filterTab, setFilterTab] = useState<'muscle' | 'equipment'>('muscle')

  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string }[]>([])
  const [memberId, setMemberId] = useState(preselectedMemberId)
  const [days] = useState(DEFAULT_DAYS)
  const [activeDay, setActiveDay] = useState('Day 1')
  const [plan, setPlan] = useState<DayPlan>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [mobilePanel, setMobilePanel] = useState<'library' | 'plan'>('library')
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [previewContext, setPreviewContext] = useState<'library' | 'plan'>('library')

  // Queries
  const { data: bodyParts = [] } = useQuery({ queryKey: ['bodyParts'], queryFn: getBodyParts })
  const { data: equipmentList = [] } = useQuery({ queryKey: ['equipment'], queryFn: getEquipmentList })
  const { data: exercises = [], isLoading: exLoading } = useQuery({
    queryKey: ['exercises-trainer', debouncedQuery, selectedBodyPart, selectedEquipment],
    queryFn: () => {
      if (selectedBodyPart) return getExercisesByBodyPart(selectedBodyPart, 30)
      if (selectedEquipment) return getExercisesByEquipment(selectedEquipment, 30)
      return searchExercises(debouncedQuery || 'chest', 30)
    },
    staleTime: 1000 * 60 * 5,
  })

  // Load members with active workout requests
  useEffect(() => {
    async function loadMembers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: activeRequests } = await supabase
        .from('requests').select('member_id').eq('trainer_id', user.id)
        .in('request_type', ['workout', 'both']).in('status', ['pending', 'in_progress'])
      if (activeRequests && activeRequests.length > 0) {
        const memberIds = [...new Set(activeRequests.map((r: any) => r.member_id))]
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
        setMembers((profiles as any) || [])
      } else {
        setMembers([])
      }
    }
    loadMembers()
  }, [supabase])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (query) { setDebouncedQuery(query); setSelectedBodyPart(''); setSelectedEquipment('') }
    }, 450)
    return () => clearTimeout(t)
  }, [query])

  // Plan actions
  const addExercise = useCallback((exercise: Exercise) => {
    setPlan(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), {
        tempId: Math.random().toString(36).slice(2),
        exercise, sets: 3, reps: '10', notes: '',
      }],
    }))
    toast.success(`Added to ${activeDay}`, { duration: 1200 })
    setSaved(false)
  }, [activeDay])

  const removeExercise = useCallback((day: string, tempId: string) => {
    setPlan(prev => ({ ...prev, [day]: (prev[day] || []).filter(e => e.tempId !== tempId) }))
    setSaved(false)
  }, [])

  const updateExercise = useCallback((day: string, tempId: string, field: keyof Omit<DayExercise, 'tempId' | 'exercise'>, value: string | number) => {
    setPlan(prev => ({
      ...prev,
      [day]: (prev[day] || []).map(e => e.tempId === tempId ? { ...e, [field]: value } : e),
    }))
    setSaved(false)
  }, [])

  async function savePlan() {
    if (!memberId) { toast.error('Please select a member first'); return }
    const totalExercises = Object.values(plan).flat().length
    if (totalExercises === 0) { toast.error('Add at least one exercise'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('routines').delete().eq('member_id', memberId).eq('trainer_id', user.id)

    const rows: any[] = []
    for (const [day, exercises] of Object.entries(plan)) {
      exercises.forEach((ex, i) => {
        rows.push({
          member_id: memberId, trainer_id: user.id, day_label: day,
          exercise_db_id: ex.exercise.id, exercise_name: ex.exercise.name,
          sets: ex.sets, reps: ex.reps, notes: ex.notes || null, order_index: i,
        })
      })
    }

    const { error } = await supabase.from('routines').insert(rows)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      setSaved(true)
      toast.success(`✅ Plan saved! ${totalExercises} exercises across ${Object.keys(plan).filter(d => plan[d]?.length > 0).length} days.`)
      try {
        const [memberRes, trainerRes] = await Promise.all([
          supabase.from('profiles').select('email, full_name').eq('id', memberId).single(),
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        ])
        const memberEmail = (memberRes.data as any)?.email
        const memberName = (memberRes.data as any)?.full_name || 'Athlete'
        const trainerName = (trainerRes.data as any)?.full_name || 'Your Trainer'
        if (memberEmail) {
          fetch('/api/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'workout', to: [memberEmail], payload: { memberName, trainerName, dayCount: Object.keys(plan).length, exerciseCount: totalExercises } }),
          }).catch(() => {})
        }
      } catch {}
    }
    setSaving(false)
  }

  const activeDayExercises = plan[activeDay] || []
  const totalExercises = Object.values(plan).flat().length
  const activeDaysCount = Object.keys(plan).filter(d => plan[d]?.length > 0).length
  const selectedMember = members.find(m => m.id === memberId)

  return (
    <>
      {previewExercise && (
        <ExercisePreviewModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
          onAdd={previewContext === 'library' ? () => addExercise(previewExercise) : undefined}
        />
      )}

      <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 130px)' }}>

        {/* Mobile panel toggle */}
        <div className="lg:hidden flex border-b border-zinc-800 bg-zinc-950 shrink-0">
          <button onClick={() => setMobilePanel('library')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mobilePanel === 'library' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
            <Search size={13} /> Library
          </button>
          <button onClick={() => setMobilePanel('plan')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mobilePanel === 'plan' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
            <Layers size={13} /> Plan
            {totalExercises > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${mobilePanel === 'plan' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                {totalExercises}
              </span>
            )}
          </button>
        </div>

        {/* LEFT: Exercise Library */}
        <div className={`w-full lg:w-80 xl:w-96 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 ${mobilePanel === 'library' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-3 border-b border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2">
                <Dumbbell size={14} className="text-red-500" /> Exercise Library
              </h2>
              <span className="ml-auto text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">800+</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={13} />
              <input value={query} onChange={e => { setQuery(e.target.value); setSelectedBodyPart(''); setSelectedEquipment('') }}
                placeholder="Search exercises, muscles…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-9 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 text-sm transition-colors" />
              {query && (
                <button onClick={() => { setQuery(''); setDebouncedQuery('chest') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex rounded-xl overflow-hidden border border-zinc-800">
              <button onClick={() => { setFilterTab('muscle'); setSelectedEquipment('') }}
                className={`flex-1 py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${filterTab === 'muscle' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <Target size={11} /> Muscle
              </button>
              <button onClick={() => { setFilterTab('equipment'); setSelectedBodyPart('') }}
                className={`flex-1 py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${filterTab === 'equipment' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <Filter size={11} /> Equipment
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {filterTab === 'muscle' ? bodyParts.map(bp => (
                <button key={bp} onClick={() => { setSelectedBodyPart(bp === selectedBodyPart ? '' : bp); setQuery('') }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all ${selectedBodyPart === bp ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>
                  {bp}
                </button>
              )) : equipmentList.map(eq => (
                <button key={eq} onClick={() => { setSelectedEquipment(eq === selectedEquipment ? '' : eq); setQuery('') }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all ${selectedEquipment === eq ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {exLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 border-b border-zinc-800/50 animate-pulse">
                  <div className="w-14 h-14 bg-zinc-900 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-zinc-900 rounded w-3/4" />
                    <div className="h-3 bg-zinc-900 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                <Search size={28} className="text-zinc-800 mb-3" />
                <p className="text-zinc-700 text-sm">No exercises found</p>
              </div>
            ) : exercises.map(ex => (
              <ExerciseLibraryCard key={ex.id} exercise={ex}
                onAdd={() => { addExercise(ex); setMobilePanel('plan') }}
                onPreview={() => { setPreviewExercise(ex); setPreviewContext('library') }}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Plan Builder */}
        <div className={`flex-1 flex flex-col overflow-hidden ${mobilePanel === 'plan' ? 'flex' : 'hidden lg:flex'}`}>

          {/* Top bar */}
          <div className="p-3 lg:p-4 border-b border-zinc-800 space-y-2 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 hover:border-zinc-600 transition-colors">
                <User size={14} className={memberId ? 'text-red-400' : 'text-zinc-600'} />
                <select value={memberId} onChange={e => { setMemberId(e.target.value); setSaved(false) }}
                  className="bg-transparent text-sm text-white focus:outline-none flex-1 min-w-0">
                  <option value="">Select member to assign…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                </select>
              </div>
              <span className="text-xs text-zinc-600 hidden sm:flex items-center gap-1 shrink-0">
                <Layers size={12} /> {totalExercises} exercises · {activeDaysCount} days
              </span>
              <button onClick={savePlan} disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-all shrink-0 ${
                  saved
                    ? 'bg-emerald-600/15 border border-emerald-600/30 text-emerald-400'
                    : 'bg-red-600 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(225,29,29,0.4)] text-white disabled:bg-zinc-800 disabled:text-zinc-600'
                }`}>
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : saved ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save Plan</>}
              </button>
            </div>
            {selectedMember && (
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Assigning to <span className="text-white font-semibold">{selectedMember.full_name || selectedMember.email}</span>
              </div>
            )}
          </div>

          {/* Day tabs */}
          <div className="px-3 lg:px-4 py-2.5 border-b border-zinc-800 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
            {days.map(day => {
              const count = plan[day]?.length || 0
              return (
                <button key={day} onClick={() => setActiveDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeDay === day
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(225,29,29,0.3)]'
                      : count > 0 ? 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600'
                  }`}>
                  {day}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      activeDay === day ? 'bg-white/20 text-white' : 'bg-red-600/20 text-red-400'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Exercises for active day */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2">
            {activeDayExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-3xl mb-5">+</div>
                <p className="text-zinc-500 font-semibold text-sm">{activeDay} is empty</p>
                <p className="text-zinc-700 text-xs mt-1 max-w-[200px]">
                  Search the library on the left and click <span className="text-red-500">+</span> to add exercises
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Dumbbell size={11} className="text-red-500" />
                    {activeDay} · {activeDayExercises.length} exercise{activeDayExercises.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-zinc-700">Click row to expand &amp; edit</p>
                </div>
                {activeDayExercises.map((item, i) => (
                  <PlanExerciseRow
                    key={item.tempId} item={item} day={activeDay} index={i}
                    onRemove={() => removeExercise(activeDay, item.tempId)}
                    onUpdate={(field, value) => updateExercise(activeDay, item.tempId, field, value)}
                    onPreview={() => { setPreviewExercise(item.exercise); setPreviewContext('plan') }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Bottom summary */}
          {totalExercises > 0 && (
            <div className="border-t border-zinc-800 px-4 py-3 flex items-center gap-4 bg-zinc-950 shrink-0">
              <div className="flex gap-4 flex-1 overflow-x-auto">
                {days.filter(d => plan[d]?.length > 0).map(d => (
                  <div key={d} className="text-center shrink-0">
                    <div className="text-sm font-black text-white">{plan[d].length}</div>
                    <div className="text-[10px] text-zinc-600">{d}</div>
                  </div>
                ))}
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-white">{totalExercises}</div>
                <div className="text-[10px] text-zinc-600">total</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Page Wrapper
// ─────────────────────────────────────────────

export default function WorkoutBuilderPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 lg:p-5 border-b border-zinc-800 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <div className="flex-1">
            <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold flex items-center gap-2">
              <span className="w-4 h-[2px] bg-red-600 rounded-full" /> Trainer Tools
            </p>
            <h1 className="text-xl lg:text-2xl font-black text-white mt-0.5 flex items-center gap-3">
              Smart Workout Builder
              <span className="text-[10px] font-semibold bg-red-600/15 text-red-400 border border-red-600/30 px-2.5 py-1 rounded-full tracking-wider uppercase">
                800+ Exercises
              </span>
            </h1>
          </div>
        </div>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            <p className="text-zinc-600 text-sm">Loading exercise library…</p>
          </div>
        </div>
      }>
        <WorkoutBuilderInner />
      </Suspense>
    </div>
  )
}
