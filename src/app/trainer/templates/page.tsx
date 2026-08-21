'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchExercises, getBodyParts, getExercisesByBodyPart, type Exercise } from '@/lib/exercisedb'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Search, X,
  Dumbbell, User, CheckCircle2, Save,
  BookOpen, Zap, Copy, ArrowRight, FileText, Target,
} from 'lucide-react'
import Image from 'next/image'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface TemplateExercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  gifUrl?: string
  sets: number
  reps: string
  notes: string
}

interface Template {
  id: string
  name: string
  description: string | null
  exercises: TemplateExercise[]
  created_at: string
}

interface Member {
  id: string
  full_name: string | null
  email: string
}

const DEFAULT_DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']

// ─────────────────────────────────────────────
// Apply Template Modal
// ─────────────────────────────────────────────

function ApplyModal({ template, members, onClose, onApplied }: {
  template: Template
  members: Member[]
  onClose: () => void
  onApplied: () => void
}) {
  const supabase = createClient()
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedDay, setSelectedDay] = useState('Day 1')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  async function applyTemplate() {
    if (!selectedMember) { toast.error('Select a member first'); return }
    setApplying(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const rows = template.exercises.map((ex, i) => ({
      member_id: selectedMember,
      trainer_id: user.id,
      day_label: selectedDay,
      exercise_db_id: ex.id,
      exercise_name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      notes: ex.notes || null,
      order_index: i,
    }))

    const { error } = await supabase.from('routines').insert(rows)
    if (error) {
      toast.error('Failed to apply: ' + error.message)
    } else {
      setApplied(true)
      const member = members.find(m => m.id === selectedMember)
      toast.success(`✅ "${template.name}" applied to ${member?.full_name || member?.email} on ${selectedDay}!`)
      onApplied()
    }
    setApplying(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Copy size={16} className="text-red-500" /> Apply Template
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5 font-medium">&#34;{template.name}&#34;</p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white rounded-xl hover:bg-zinc-900 transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center shrink-0">
              <Dumbbell size={18} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">{template.exercises.length} exercises</span>
                <span className="text-zinc-700 text-xs">·</span>
                {[...new Set(template.exercises.map(e => e.bodyPart))].slice(0, 3).map(bp => (
                  <span key={bp} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full capitalize">{bp}</span>
                ))}
              </div>
              {template.description && <p className="text-xs text-zinc-600 mt-0.5 truncate">{template.description}</p>}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">
              Assign to Member
            </label>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-600 transition-colors">
              <User size={14} className={selectedMember ? 'text-red-400' : 'text-zinc-600'} />
              <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none flex-1">
                <option value="">Select a member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
              </select>
            </div>
            {members.length === 0 && (
              <p className="text-xs text-zinc-700 mt-1.5">No members with active workout requests found.</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">
              Assign to Day
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DEFAULT_DAYS.map(day => (
                <button key={day} onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDay === day ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                  }`}>{day}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-bold text-sm rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={applyTemplate} disabled={applying || !selectedMember || applied}
              className={`flex-1 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                applied ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-400'
                  : 'bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white'
              }`}>
              {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : applied ? <><CheckCircle2 size={14} /> Applied!</>
                  : <><ArrowRight size={14} /> Apply Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Exercise Edit Row (inside builder)
// ─────────────────────────────────────────────

function ExerciseEditRow({ ex, index, onRemove, onUpdate }: {
  ex: TemplateExercise
  index: number
  onRemove: () => void
  onUpdate: (field: keyof Pick<TemplateExercise, 'sets' | 'reps' | 'notes'>, value: string | number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-3 p-3">
        <span className="text-[10px] text-zinc-700 font-black w-4 shrink-0 text-center">{index + 1}</span>
        <div className="relative w-10 h-10 bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-700">
          {ex.gifUrl
            ? <Image src={ex.gifUrl} alt={ex.name} fill unoptimized className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-base">💪</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white capitalize truncate">{ex.name}</p>
          <p className="text-[10px] text-zinc-600 capitalize">{ex.bodyPart}</p>
        </div>
        <div className="flex items-center gap-1 text-xs shrink-0">
          <span className="font-black text-white">{ex.sets}</span>
          <span className="text-zinc-700">×</span>
          <span className="font-black text-white">{ex.reps}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-all shrink-0">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button onClick={onRemove} className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-950/20 transition-all shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-800/60 p-3 space-y-3 bg-zinc-950/50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Sets</label>
              <input type="number" min={1} max={20} value={ex.sets}
                onChange={e => onUpdate('sets', parseInt(e.target.value) || 1)}
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Reps</label>
              <input type="text" placeholder="e.g. 10 or 8-12" value={ex.reps}
                onChange={e => onUpdate('reps', e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold flex items-center gap-1">
              <Zap size={10} /> Coach Notes
            </label>
            <input type="text" placeholder="e.g. Slow eccentric, keep core tight…" value={ex.notes}
              onChange={e => onUpdate('notes', e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Template Builder Modal
// ─────────────────────────────────────────────

function BuilderModal({ template, onClose, onSaved }: {
  template: Template
  onClose: () => void
  onSaved: (updated: Template) => void
}) {
  const supabase = createClient()
  const [exercises, setExercises] = useState<TemplateExercise[]>(template.exercises || [])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('chest')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState<'library' | 'exercises'>('library')

  const { data: bodyParts = [] } = useQuery({ queryKey: ['bodyParts'], queryFn: getBodyParts })
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['builder-search', debouncedQuery, selectedBodyPart],
    queryFn: () => selectedBodyPart ? getExercisesByBodyPart(selectedBodyPart, 25) : searchExercises(debouncedQuery || 'chest', 25),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const t = setTimeout(() => { if (query) { setDebouncedQuery(query); setSelectedBodyPart('') } }, 450)
    return () => clearTimeout(t)
  }, [query])

  function addExercise(ex: Exercise) {
    if (exercises.find(e => e.id === ex.id)) { toast.error('Already in template'); return }
    setExercises(prev => [...prev, {
      id: ex.id, name: ex.name, bodyPart: ex.bodyPart, equipment: ex.equipment,
      gifUrl: ex.gifUrl, sets: 3, reps: '10', notes: '',
    }])
    toast.success(`Added ${ex.name}`, { duration: 1200 })
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function updateExercise(id: string, field: keyof Pick<TemplateExercise, 'sets' | 'reps' | 'notes'>, value: string | number) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function saveTemplate() {
    setSaving(true)
    const { error } = await supabase.from('routine_templates').update({ exercises }).eq('id', template.id)
    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(`✅ Template saved — ${exercises.length} exercises`)
      onSaved({ ...template, exercises })
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Editing Template</p>
            <h2 className="font-black text-white text-base truncate">{template.name}</h2>
          </div>
          <span className="text-xs text-zinc-600 font-semibold shrink-0">{exercises.length} exercises</span>
          <button onClick={saveTemplate} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all shrink-0">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
          </button>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white rounded-xl hover:bg-zinc-900 transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Mobile panel toggle */}
        <div className="sm:hidden flex border-b border-zinc-800 shrink-0">
          <button onClick={() => setPanel('library')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${panel === 'library' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
            Library
          </button>
          <button onClick={() => setPanel('exercises')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${panel === 'exercises' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
            Exercises ({exercises.length})
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Exercise Search */}
          <div className={`w-full sm:w-72 lg:w-80 border-r border-zinc-800 flex flex-col ${panel === 'library' ? 'flex' : 'hidden sm:flex'}`}>
            <div className="p-3 border-b border-zinc-800 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={13} />
                <input value={query} onChange={e => { setQuery(e.target.value); setSelectedBodyPart('') }}
                  placeholder="Search exercises…"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-8 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 text-sm transition-colors" />
                {query && (
                  <button onClick={() => { setQuery(''); setDebouncedQuery('chest') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {bodyParts.map(bp => (
                  <button key={bp} onClick={() => { setSelectedBodyPart(bp === selectedBodyPart ? '' : bp); setQuery('') }}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize transition-all ${
                      selectedBodyPart === bp ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}>{bp}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5 p-3 border-b border-zinc-800/50 animate-pulse">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-2.5 bg-zinc-900 rounded w-3/4" />
                      <div className="h-2.5 bg-zinc-900 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : results.map(ex => (
                <div key={ex.id} className="group flex gap-2.5 p-3 border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-all">
                  <div className="relative w-12 h-12 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800">
                    {ex.gifUrl
                      ? <Image src={ex.gifUrl} alt={ex.name} fill unoptimized className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">💪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white capitalize leading-tight line-clamp-2">{ex.name}</p>
                    <p className="text-[10px] text-zinc-600 capitalize mt-0.5">{ex.bodyPart} · {ex.equipment}</p>
                  </div>
                  <button onClick={() => addExercise(ex)}
                    className="shrink-0 w-7 h-7 bg-red-600/15 border border-red-700/30 rounded-lg text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 opacity-100">
                    <Plus size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Template Exercises */}
          <div className={`flex-1 flex flex-col overflow-hidden ${panel === 'exercises' ? 'flex' : 'hidden sm:flex'}`}>
            {exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-3xl mb-4">+</div>
                <p className="text-zinc-500 font-semibold">Template is empty</p>
                <p className="text-zinc-700 text-xs mt-1">Search and add exercises from the library</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Dumbbell size={11} className="text-red-500" /> {exercises.length} Exercises
                  </p>
                  <p className="text-[10px] text-zinc-700">Expand to edit sets / reps</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {exercises.map((ex, i) => (
                    <ExerciseEditRow key={ex.id} ex={ex} index={i}
                      onRemove={() => removeExercise(ex.id)}
                      onUpdate={(field, val) => updateExercise(ex.id, field, val)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Template Card
// ─────────────────────────────────────────────

function TemplateCard({ template, members, onDelete, onUpdate }: {
  template: Template
  members: Member[]
  onDelete: () => void
  onUpdate: (updated: Template) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const muscleGroups = [...new Set(template.exercises.map(e => e.bodyPart))].slice(0, 4)
  const exerciseCount = template.exercises.length

  return (
    <>
      {showApply && (
        <ApplyModal template={template} members={members} onClose={() => setShowApply(false)} onApplied={() => setShowApply(false)} />
      )}
      {showBuilder && (
        <BuilderModal template={template} onClose={() => setShowBuilder(false)}
          onSaved={updated => { onUpdate(updated); setShowBuilder(false) }} />
      )}

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-600/20 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-white text-sm">{template.name}</h3>
              <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </span>
            </div>
            {template.description && <p className="text-xs text-zinc-600 mt-0.5 truncate">{template.description}</p>}
            {muscleGroups.length > 0 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {muscleGroups.map(mg => (
                  <span key={mg} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full capitalize">{mg}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-700 hidden sm:block">
              {new Date(template.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => setShowBuilder(true)}
              className="px-3 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:text-white transition-all flex items-center gap-1.5">
              <Dumbbell size={12} /> Edit
            </button>
            <button onClick={() => setShowApply(true)} disabled={exerciseCount === 0}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl transition-all flex items-center gap-1.5">
              <Copy size={12} /> Apply
            </button>
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <button onClick={onDelete} className="px-2 py-1.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 text-[11px] font-bold text-zinc-400 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-zinc-800 px-5 py-4">
            {exerciseCount === 0 ? (
              <div className="text-center py-4">
                <p className="text-zinc-600 text-sm">No exercises yet.</p>
                <button onClick={() => setShowBuilder(true)} className="text-red-500 text-xs hover:text-red-400 mt-1 flex items-center gap-1 mx-auto">
                  <Plus size={12} /> Add exercises using Edit
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {template.exercises.map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-600/30 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="relative w-8 h-8 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                      {ex.gifUrl
                        ? <Image src={ex.gifUrl} alt={ex.name} fill unoptimized className="object-cover" />
                        : <div className="text-xs flex items-center justify-center h-full">💪</div>}
                    </div>
                    <span className="text-sm text-white capitalize flex-1 min-w-0 truncate font-medium">{ex.name}</span>
                    <span className="text-xs text-zinc-600 shrink-0">{ex.sets}×{ex.reps}</span>
                    {ex.notes && <span className="text-[10px] text-zinc-700 truncate max-w-[120px] hidden sm:block">{ex.notes}</span>}
                  </div>
                ))}
                <div className="pt-2 flex items-center gap-3 border-t border-zinc-800/60 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Target size={11} className="text-red-500" />
                    {muscleGroups.join(' · ')}
                  </div>
                  <button onClick={() => setShowApply(true)}
                    className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold transition-colors">
                    Apply to Member <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [templatesRes, requestsRes] = await Promise.all([
      supabase.from('routine_templates').select('*').eq('trainer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('requests').select('member_id').eq('trainer_id', user.id)
        .in('request_type', ['workout', 'both']).in('status', ['pending', 'in_progress']),
    ])

    setTemplates((templatesRes.data as Template[]) || [])

    if (requestsRes.data && requestsRes.data.length > 0) {
      const memberIds = [...new Set((requestsRes.data as any[]).map(r => r.member_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
      setMembers((profiles as Member[]) || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function createTemplate() {
    if (!newName.trim()) { toast.error('Give your template a name'); return }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('routine_templates').insert({
      trainer_id: user.id, name: newName.trim(), description: newDesc.trim() || null, exercises: [],
    }).select().single()
    if (error) toast.error('Failed: ' + error.message)
    else {
      setTemplates(prev => [data as Template, ...prev])
      setNewName(''); setNewDesc(''); setShowCreate(false)
      toast.success('✅ Template created! Use the Edit button to add exercises.')
    }
    setCreating(false)
  }

  function deleteTemplate(id: string) {
    supabase.from('routine_templates').delete().eq('id', id).then(() => {
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Template deleted')
    })
  }

  function updateTemplate(updated: Template) {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const totalExercises = templates.reduce((sum, t) => sum + (t.exercises?.length || 0), 0)

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold flex items-center gap-2">
            <span className="w-4 h-[2px] bg-red-600 rounded-full" /> Trainer Tools
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">Routine Templates</h1>
          <p className="text-zinc-500 text-sm mt-1">Save your best plans as reusable templates — apply to any member with one click.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shrink-0 hover:shadow-[0_0_20px_rgba(225,29,29,0.3)]">
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Stats strip */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Templates', value: templates.length, color: 'text-red-400' },
            { label: 'Total Exercises', value: totalExercises, color: 'text-violet-400' },
            { label: 'Members Available', value: members.length, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create template form */}
      {showCreate && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} className="text-red-500" /> New Template
            </h2>
            <button onClick={() => setShowCreate(false)} className="text-zinc-600 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-all">
              <X size={14} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block font-bold">Template Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createTemplate()}
                placeholder="e.g. 4-Day Push Pull Legs"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block font-bold">Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Who is this best suited for?"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={createTemplate} disabled={creating || !newName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm rounded-xl transition-all">
              {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Create</>}
            </button>
            <p className="text-xs text-zinc-600">Then use <strong className="text-zinc-400">Edit</strong> to add exercises.</p>
          </div>
        </div>
      )}

      {/* Templates list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-950 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={32} className="text-zinc-700" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No Templates Yet</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">
            Create your first template to speed up plan creation. Build once, apply to any member instantly.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all mx-auto">
            <Plus size={15} /> Create First Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              members={members}
              onDelete={() => deleteTemplate(template.id)}
              onUpdate={updateTemplate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
