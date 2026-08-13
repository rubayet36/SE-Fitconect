'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { searchExercises, getBodyParts, getExercisesByBodyPart, type Exercise } from '@/lib/exercisedb'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Save } from 'lucide-react'
import Image from 'next/image'

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

function WorkoutBuilderInner() {
  const searchParams = useSearchParams()
  const preselectedMemberId = searchParams.get('member') || ''
  const supabase = createClient()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('chest')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string }[]>([])
  const [memberId, setMemberId] = useState(preselectedMemberId)
  const [days] = useState(DEFAULT_DAYS)
  const [activeDay, setActiveDay] = useState('Day 1')
  const [plan, setPlan] = useState<DayPlan>({})
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { data: bodyParts } = useQuery({ queryKey: ['bodyParts'], queryFn: getBodyParts })
  const { data: exercises, isLoading: exLoading } = useQuery({
    queryKey: ['exercises-trainer', debouncedQuery, selectedBodyPart],
    queryFn: () => selectedBodyPart
      ? getExercisesByBodyPart(selectedBodyPart, 20)
      : searchExercises(debouncedQuery || 'chest', 20),
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadActiveMembers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find active requests for this trainer
      const { data: activeRequests } = await supabase
        .from('requests')
        .select('member_id')
        .eq('trainer_id', user.id)
        .in('request_type', ['workout', 'both'])
        .in('status', ['pending', 'in_progress'])

      if (activeRequests && activeRequests.length > 0) {
        const memberIds = [...new Set(activeRequests.map(r => r.member_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', memberIds)
        setMembers(profiles || [])
      } else {
        setMembers([])
      }
    }
    loadActiveMembers()
  }, [supabase])

  useEffect(() => {
    const t = setTimeout(() => { if (query) setDebouncedQuery(query) }, 500)
    return () => clearTimeout(t)
  }, [query])

  function addExercise(exercise: Exercise) {
    setPlan(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), {
        tempId: Math.random().toString(36).slice(2),
        exercise,
        sets: 3,
        reps: '10',
        notes: '',
      }],
    }))
  }

  function removeExercise(day: string, tempId: string) {
    setPlan(prev => ({ ...prev, [day]: (prev[day] || []).filter(e => e.tempId !== tempId) }))
  }

  function updateExercise(day: string, tempId: string, field: keyof Omit<DayExercise, 'tempId' | 'exercise'>, value: string | number) {
    setPlan(prev => ({
      ...prev,
      [day]: (prev[day] || []).map(e => e.tempId === tempId ? { ...e, [field]: value } : e),
    }))
  }

  async function savePlan() {
    if (!memberId) { toast.error('Please select a member'); return }
    const totalExercises = Object.values(plan).flat().length
    if (totalExercises === 0) { toast.error('Add at least one exercise'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Delete existing routines for this member-trainer combo
    await supabase.from('routines').delete().eq('member_id', memberId).eq('trainer_id', user.id)

    const rows: { member_id: string, trainer_id: string, day_label: string, exercise_db_id: string, exercise_name: string, sets: number, reps: string, notes: string | null, order_index: number }[] = []
    for (const [day, exercises] of Object.entries(plan)) {
      exercises.forEach((ex, i) => {
        rows.push({
          member_id: memberId,
          trainer_id: user.id,
          day_label: day,
          exercise_db_id: ex.exercise.id,
          exercise_name: ex.exercise.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes || null,
          order_index: i,
        })
      })
    }
    
    const { error } = await supabase.from('routines').insert(rows)
    if (error) toast.error('Failed to save: ' + error.message)
    else {
      toast.success(`Workout plan saved! ${totalExercises} exercises across ${Object.keys(plan).length} days.`)

      // ── Email the member ───────────────────────────────
      try {
        const [memberRes, trainerRes] = await Promise.all([
          supabase.from('profiles').select('email, full_name').eq('id', memberId).single(),
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        ])
        const memberEmail = (memberRes.data as { email?: string })?.email
        const memberName = (memberRes.data as { full_name?: string })?.full_name || 'Athlete'
        const trainerName = (trainerRes.data as { full_name?: string })?.full_name || 'Your Trainer'
        
        if (memberEmail) {
          console.log(`[workout-builder] Sending email to ${memberEmail}`)
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'workout',
              to: [memberEmail],
              payload: {
                memberName,
                trainerName,
                dayCount: Object.keys(plan).length,
                exerciseCount: totalExercises,
              },
            }),
          })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              toast.success(`📧 Notification emailed to ${memberName}`)
            } else {
              console.error('[workout-builder] Email API error:', data)
              toast.error(`Email failed: ${data.error || 'Unknown error'}`)
            }
          })
          .catch(err => {
             console.error('[workout-builder] Fetch error:', err)
             toast.warning('Plan saved but email notification server was unreachable')
          })
        } else {
          console.warn('[workout-builder] Member email not found in profiles table')
          toast.warning(`Notification skipped: No email found for ${memberName}`)
        }
      } catch (dbErr) {
        console.error('[workout-builder] Database fetch error:', dbErr)
        toast.error('Plan saved but could not fetch member email for notification')
      }
    }
    setSaving(false)
  }

  const activeDayExercises = plan[activeDay] || []
  const totalExercises = Object.values(plan).flat().length

  const [mobilePanel, setMobilePanel] = useState<'library' | 'plan'>('library')

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Mobile panel toggle */}
      <div className="lg:hidden flex border-b border-zinc-800 bg-zinc-950">
        <button onClick={() => setMobilePanel('library')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${mobilePanel === 'library' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
          🔍 Exercise Library
        </button>
        <button onClick={() => setMobilePanel('plan')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${mobilePanel === 'plan' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>
          📋 Plan Builder {activeDayExercises.length > 0 && `(${activeDayExercises.length})`}
        </button>
      </div>

      {/* LEFT: Exercise Search */}
      <div className={`w-full lg:w-80 xl:w-96 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 ${mobilePanel === 'library' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <h2 className="font-black text-white text-sm uppercase tracking-widest">Exercise Library</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedBodyPart('') }}
              placeholder="Search exercises..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 text-sm transition-colors"
            />
          </div>
          {bodyParts && (
            <div className="flex flex-wrap gap-1.5">
              {bodyParts.slice(0, 8).map(bp => (
                <button key={bp} onClick={() => { setSelectedBodyPart(bp); setQuery('') }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    selectedBodyPart === bp ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}>{bp}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {exLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 border-b border-zinc-800/50 animate-pulse">
                <div className="w-12 h-12 bg-zinc-900 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-zinc-900 rounded w-3/4" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : exercises?.map(ex => (
            <div key={ex.id} className="flex gap-3 p-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                {ex.gifUrl && <Image src={ex.gifUrl} alt={ex.name} width={48} height={48} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white capitalize leading-tight line-clamp-2">{ex.name}</p>
                <p className="text-xs text-zinc-600 mt-0.5 capitalize">{ex.bodyPart}</p>
              </div>
              <button onClick={() => { addExercise(ex); setMobilePanel('plan') }}
                className="shrink-0 w-8 h-8 bg-red-600/20 border border-red-800/30 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 opacity-100">
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Plan builder */}
      <div className={`flex-1 flex flex-col overflow-hidden ${mobilePanel === 'plan' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Top controls */}
        <div className="p-3 lg:p-4 border-b border-zinc-800 flex items-center gap-2 flex-wrap">
          <select value={memberId} onChange={e => setMemberId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition-colors flex-1 min-w-0">
            <option value="">Select Member...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
            ))}
          </select>
          <span className="text-xs text-zinc-600 hidden sm:block">{totalExercises} exercises</span>
          <button onClick={savePlan} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold text-sm rounded-lg transition-all hover:shadow-[0_0_15px_rgba(225,29,29,0.4)] shrink-0">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
          </button>
        </div>

        {/* Day tabs */}
        <div className="px-3 lg:px-4 py-2 border-b border-zinc-800 flex gap-1 overflow-x-auto scrollbar-none">
          {days.map(day => (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeDay === day
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
              }`}>
              {day}
              {plan[day]?.length > 0 && <span className="ml-1.5 text-[10px] opacity-70">({plan[day].length})</span>}
            </button>
          ))}
        </div>

        {/* Day exercises */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3">
          {activeDayExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-2xl mb-4">+</div>
              <p className="text-zinc-600 text-sm">
                {isMobile ? 'Tap "Exercise Library" tab to search and add exercises' : 'Search exercises on the left and click + to add them here'}
              </p>
            </div>
          ) : activeDayExercises.map((item) => (
            <div key={item.tempId} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-sm capitalize">{item.exercise.name}</p>
                    <button onClick={() => removeExercise(activeDay, item.tempId)}
                      className="text-zinc-700 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-600 uppercase tracking-widest">Sets</label>
                      <input type="number" min={1} max={10} value={item.sets}
                        onChange={e => updateExercise(activeDay, item.tempId, 'sets', parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors mt-1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-600 uppercase tracking-widest">Reps</label>
                      <input type="text" placeholder="e.g. 10 or 8-12" value={item.reps}
                        onChange={e => updateExercise(activeDay, item.tempId, 'reps', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest">Coach Notes</label>
                    <input type="text" placeholder="e.g. Keep core tight, slow eccentric..." value={item.notes}
                      onChange={e => updateExercise(activeDay, item.tempId, 'notes', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors mt-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WorkoutBuilderPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 lg:p-6 border-b border-zinc-800 bg-black/50 backdrop-blur-sm">
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Trainer Tools</p>
        <h1 className="text-2xl font-black text-white mt-0.5">Smart Workout Builder</h1>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /></div>}>
        <WorkoutBuilderInner />
      </Suspense>
    </div>
  )
}
