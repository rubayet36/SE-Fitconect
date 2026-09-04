'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { clientSearchExercises, clientGetBodyParts, clientGetExercisesByBodyPart, clientGetEquipmentList, clientGetExercisesByEquipment, type Exercise } from '@/lib/exercisedb'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Search, Plus, Trash2, Save, ChevronDown, ChevronUp,
  Dumbbell, Info, X, Filter, User, Layers,
  BookOpen, Target, Zap, CheckCircle2, Bookmark, FolderDown,
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

interface RoutineTemplate {
  id: string
  name: string
  description: string | null
  exercises: any[]
  created_at: string
}

const DEFAULT_DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']

// ─────────────────────────────────────────────
// Save As Template Modal
// ─────────────────────────────────────────────

function SaveTemplateModal({
  plan,
  activeDay,
  onClose,
  onSaved,
}: {
  plan: DayPlan
  activeDay: string
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [scope, setScope] = useState<'day' | 'all'>('day')
  const [saving, setSaving] = useState(false)

  const activeDayExercises = plan[activeDay] || []
  const allExercises = Object.values(plan).flat()
  const targetExercises = scope === 'day' ? activeDayExercises : allExercises

  async function handleSave() {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }
    if (targetExercises.length === 0) {
      toast.error('No exercises to save in this template')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // 1. Insert the template header (no exercises JSON)
    const { data: tpl, error: tplErr } = await supabase
      .from('routine_templates')
      .insert({
        trainer_id: user.id,
        name: templateName.trim(),
        description: templateDesc.trim() || null,
      })
      .select('id')
      .single()

    if (tplErr || !tpl) {
      toast.error('Failed to save template: ' + (tplErr?.message ?? 'unknown'))
      setSaving(false)
      return
    }

    // 2. Insert each exercise as a normalized child row
    const exerciseRows = targetExercises.map((item, i) => ({
      template_id: tpl.id,
      exercise_db_id: item.exercise.id,
      exercise_name: item.exercise.name,
      body_part: item.exercise.bodyPart || null,
      equipment: item.exercise.equipment || null,
      target: item.exercise.target || null,
      gif_url: item.exercise.gifUrl || null,
      sets: item.sets,
      reps: item.reps,
      notes: item.notes || null,
      order_index: i,
    }))

    const { error: exErr } = await supabase
      .from('routine_template_exercises')
      .insert(exerciseRows)

    if (exErr) {
      toast.error('Template header saved but exercises failed: ' + exErr.message)
    } else {
      toast.success(`✅ Template "${templateName}" saved with ${targetExercises.length} exercises!`)
      onSaved()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Bookmark size={18} className="text-red-500" /> Save as Template
          </h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Template Name *</label>
            <input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. Hypertrophy Push Day"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Description (Optional)</label>
            <input
              value={templateDesc}
              onChange={e => setTemplateDesc(e.target.value)}
              placeholder="e.g. Focus on chest & triceps progressive overload"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Template Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('day')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  scope === 'day'
                    ? 'bg-red-600/15 border-red-600/40 text-red-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {activeDay} ({activeDayExercises.length} ex)
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  scope === 'all'
                    ? 'bg-red-600/15 border-red-600/40 text-red-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All Days ({allExercises.length} ex)
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !templateName.trim() || targetExercises.length === 0}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Bookmark size={13} /> Save Template</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Load Template Modal
// ─────────────────────────────────────────────

function LoadTemplateModal({
  activeDay,
  onClose,
  onLoad,
}: {
  activeDay: string
  onClose: () => void
  onLoad: (exercises: DayExercise[]) => void
}) {
  const supabase = createClient()
  const [templates, setTemplates] = useState<RoutineTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTemplates() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Join child exercise rows so we can convert them on load
      const { data } = await supabase
        .from('routine_templates')
        .select('*, routine_template_exercises(*)')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
      // Normalise: map child rows → exercises array expected by the rest of the component
      const normalised = (data || []).map((t: any) => ({
        ...t,
        exercises: (t.routine_template_exercises || []).map((ex: any) => ({
          id: ex.exercise_db_id,
          name: ex.exercise_name,
          bodyPart: ex.body_part || '',
          equipment: ex.equipment || '',
          target: ex.target || '',
          secondaryMuscles: [],
          instructions: [],
          gifUrl: ex.gif_url || '',
          images: [],
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes || '',
        })),
      }))
      setTemplates(normalised as RoutineTemplate[])
      setLoading(false)
    }
    fetchTemplates()
  }, [supabase])

  function handleSelectTemplate(tpl: RoutineTemplate) {
    if (!tpl.exercises || tpl.exercises.length === 0) {
      toast.error('This template is empty')
      return
    }

    const converted: DayExercise[] = tpl.exercises.map((ex: any) => ({
      tempId: Math.random().toString(36).slice(2),
      exercise: {
        id: ex.id || ex.exercise_db_id || ex.exercise?.id || String(Math.random()),
        name: ex.name || ex.exercise_name || ex.exercise?.name || 'Exercise',
        bodyPart: ex.bodyPart || ex.exercise?.bodyPart || '',
        equipment: ex.equipment || ex.exercise?.equipment || '',
        target: ex.target || ex.exercise?.target || '',
        secondaryMuscles: ex.secondaryMuscles || ex.exercise?.secondaryMuscles || [],
        instructions: ex.instructions || ex.exercise?.instructions || [],
        gifUrl: ex.gifUrl || ex.exercise?.gifUrl || '',
        images: ex.images || ex.exercise?.images || [],
      },
      sets: ex.sets || 3,
      reps: ex.reps || '10',
      notes: ex.notes || '',
    }))

    onLoad(converted)
    toast.success(`Loaded ${converted.length} exercises from "${tpl.name}" into ${activeDay}!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FolderDown size={18} className="text-red-500" /> Load Template
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Insert reusable routine into <span className="text-red-400 font-bold">{activeDay}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/60 rounded-2xl animate-pulse" />
            ))
          ) : templates.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={30} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-400">No saved templates found</p>
              <p className="text-xs text-zinc-600 mt-1">Build a routine and click &#34;Save as Template&#34; to reuse it anytime.</p>
            </div>
          ) : (
            templates.map(tpl => {
              const exCount = tpl.exercises?.length || 0
              return (
                <div
                  key={tpl.id}
                  className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-white truncate">{tpl.name}</h4>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                        {exCount} exercise{exCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {tpl.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{tpl.description}</p>}
                  </div>
                  <button
                    onClick={() => handleSelectTemplate(tpl)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Plus size={12} /> Insert
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

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
          <span className="text-[10px] text-zinc-500 capitalize">{exercise.bodyPart}</span>
          <span className="text-zinc-700 text-[10px]">·</span>
          <span className="text-[10px] text-zinc-500 capitalize">{exercise.equipment}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onPreview}
          className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 transition-all"
          title="View full instructions"
        >
          <Info size={14} />
        </button>
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(225,29,29,0.3)]"
          title="Add to active day"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Plan Exercise Row (with collapse/expand)
// ─────────────────────────────────────────────

function PlanExerciseRow({
  item,
  day,
  index,
  onRemove,
  onUpdate,
  onPreview,
}: {
  item: DayExercise
  day: string
  index: number
  onRemove: () => void
  onUpdate: (field: keyof Omit<DayExercise, 'tempId' | 'exercise'>, value: string | number) => void
  onPreview: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-3 p-3">
        <span className="w-5 h-5 rounded-full bg-red-600/15 border border-red-600/30 text-red-400 text-[10px] font-black flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        <button onClick={onPreview} className="relative w-10 h-10 bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-700 hover:border-zinc-500 transition-all">
          {item.exercise.gifUrl ? (
            <Image src={item.exercise.gifUrl} alt={item.exercise.name} fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm">💪</div>
          )}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <p className="text-xs font-bold text-white capitalize truncate">{item.exercise.name}</p>
          <p className="text-[10px] text-zinc-500 capitalize">{item.exercise.bodyPart} · {item.exercise.equipment}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <span className="font-black text-white">{item.sets}</span>
          <span className="text-zinc-600">×</span>
          <span className="font-black text-white">{item.reps}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/20 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-3 space-y-3 bg-zinc-950/60">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Sets</label>
              <input
                type="number"
                min={1}
                max={20}
                value={item.sets}
                onChange={e => onUpdate('sets', parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Reps / Duration</label>
              <input
                type="text"
                placeholder="e.g. 10 or 8-12 or 45s"
                value={item.reps}
                onChange={e => onUpdate('reps', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <Zap size={10} className="text-yellow-500" /> Coach Execution Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Control eccentric tempo, 90s rest, keep elbows tucked…"
              value={item.notes}
              onChange={e => onUpdate('notes', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Inner Page Component
// ─────────────────────────────────────────────

function WorkoutBuilderInner() {
  const searchParams = useSearchParams()
  const preselectedMemberId = searchParams.get('member') || ''
  const initialTemplateId = searchParams.get('templateId') || ''
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

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false)

  const [mobilePanel, setMobilePanel] = useState<'library' | 'plan'>('library')
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [previewContext, setPreviewContext] = useState<'library' | 'plan'>('library')

  // Queries
  const { data: bodyParts = [] } = useQuery({ queryKey: ['bodyParts'], queryFn: clientGetBodyParts })
  const { data: equipmentList = [] } = useQuery({ queryKey: ['equipment'], queryFn: clientGetEquipmentList })
  const { data: exercises = [], isLoading: exLoading } = useQuery({
    queryKey: ['exercises-trainer', debouncedQuery, selectedBodyPart, selectedEquipment],
    queryFn: () => {
      if (selectedBodyPart) return clientGetExercisesByBodyPart(selectedBodyPart, 30)
      if (selectedEquipment) return clientGetExercisesByEquipment(selectedEquipment, 30)
      return clientSearchExercises(debouncedQuery || 'chest', 30)
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

  // Load template from URL if present
  useEffect(() => {
    if (!initialTemplateId) return
    async function loadInitialTemplate() {
      const { data } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('id', initialTemplateId)
        .single()
      if (data && data.exercises && data.exercises.length > 0) {
        const converted: DayExercise[] = data.exercises.map((ex: any) => ({
          tempId: Math.random().toString(36).slice(2),
          exercise: {
            id: ex.id || String(Math.random()),
            name: ex.name || 'Exercise',
            bodyPart: ex.bodyPart || '',
            equipment: ex.equipment || '',
            target: ex.target || '',
            secondaryMuscles: ex.secondaryMuscles || [],
            instructions: ex.instructions || [],
            gifUrl: ex.gifUrl || '',
            images: ex.images || [],
          },
          sets: ex.sets || 3,
          reps: ex.reps || '10',
          notes: ex.notes || '',
        }))
        setPlan(prev => ({ ...prev, [activeDay]: converted }))
        toast.success(`Template "${data.name}" loaded into ${activeDay}!`)
      }
    }
    loadInitialTemplate()
  }, [initialTemplateId, supabase, activeDay])

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

    // 1. Delete old routines + old plan header for this member
    await supabase.from('routines').delete().eq('member_id', memberId).eq('trainer_id', user.id)
    await supabase.from('routine_plans').delete().eq('member_id', memberId).eq('trainer_id', user.id)

    // 2. Create new plan header
    const { data: planHeader, error: planErr } = await supabase
      .from('routine_plans')
      .insert({ member_id: memberId, trainer_id: user.id })
      .select('id')
      .single()

    if (planErr || !planHeader) {
      toast.error('Failed to create plan header: ' + (planErr?.message ?? 'unknown'))
      setSaving(false)
      return
    }

    // 3. Insert exercise rows with plan_id
    const rows: any[] = []
    for (const [day, exercises] of Object.entries(plan)) {
      exercises.forEach((ex, i) => {
        rows.push({
          plan_id: planHeader.id,
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

      {showSaveTemplateModal && (
        <SaveTemplateModal
          plan={plan}
          activeDay={activeDay}
          onClose={() => setShowSaveTemplateModal(false)}
          onSaved={() => setShowSaveTemplateModal(false)}
        />
      )}

      {showLoadTemplateModal && (
        <LoadTemplateModal
          activeDay={activeDay}
          onClose={() => setShowLoadTemplateModal(false)}
          onLoad={(loadedExercises) => {
            setPlan(prev => ({ ...prev, [activeDay]: [...(prev[activeDay] || []), ...loadedExercises] }))
            setSaved(false)
          }}
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

              {/* Template Actions Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLoadTemplateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all"
                  title="Load a saved routine template into this day"
                >
                  <FolderDown size={13} className="text-red-400" />
                  <span className="hidden sm:inline">Load Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={totalExercises === 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 disabled:opacity-40 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all"
                  title="Save current workout routine as a reusable template"
                >
                  <Bookmark size={13} className="text-red-400" />
                  <span className="hidden sm:inline">Save Template</span>
                </button>
              </div>

              <span className="text-xs text-zinc-600 hidden xl:flex items-center gap-1 shrink-0">
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
                <p className="text-zinc-700 text-xs mt-1 max-w-[240px]">
                  Search exercises on the left, or click <button onClick={() => setShowLoadTemplateModal(true)} className="text-red-400 font-bold hover:underline">Load Template</button> to insert a saved routine.
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
