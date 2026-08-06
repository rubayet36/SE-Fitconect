'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBodyParts, getEquipmentList, getExercisesByBodyPart, getExercisesByEquipment, searchExercises, type Exercise } from '@/lib/exercisedb'
import { createClient } from '@/lib/supabase/client'
import { capitalize } from '@/lib/utils'
import { Search, Bookmark, BookmarkCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function ExplorePage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'bodyPart' | 'equipment'>('all')
  const [selected, setSelected] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const { data: bodyParts } = useQuery({ queryKey: ['bodyParts'], queryFn: getBodyParts })
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipmentList })

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', filterType, selected, debouncedQuery],
    queryFn: () => {
      if (debouncedQuery) return searchExercises(debouncedQuery, 24)
      if (filterType === 'bodyPart' && selected) return getExercisesByBodyPart(selected, 24)
      if (filterType === 'equipment' && selected) return getExercisesByEquipment(selected, 24)
      return getExercisesByBodyPart('chest', 24)
    },
    enabled: true,
  })

  function handleSearchChange(val: string) {
    setSearchQuery(val)
    const timeoutId = setTimeout(() => setDebouncedQuery(val), 500)
    return () => clearTimeout(timeoutId)
  }

  async function toggleBookmark(ex: Exercise) {
    const supabaseClient = supabase
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return

    if (bookmarked.has(ex.id)) {
      await supabaseClient.from('bookmarks').delete().eq('user_id', user.id).eq('exercise_db_id', ex.id)
      setBookmarked(prev => { const n = new Set(prev); n.delete(ex.id); return n })
      toast.success('Bookmark removed')
    } else {
      await supabaseClient.from('bookmarks').upsert({
        user_id: user.id,
        exercise_db_id: ex.id,
        exercise_name: ex.name,
        exercise_gif: ex.gifUrl || null,
      })
      setBookmarked(prev => new Set([...prev, ex.id]))
      toast.success('Bookmarked!')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Discovery</p>
        <h1 className="text-3xl font-black text-white mt-1">Exercise Library</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search exercises (e.g. Bicep Curl, Squat...)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
        />
      </div>

      {/* Filters */}
      {!debouncedQuery && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['all', 'bodyPart', 'equipment'] as const).map(f => (
              <button key={f} onClick={() => { setFilterType(f); setSelected('') }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filterType === f ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}>
                {f === 'all' ? 'Featured' : f === 'bodyPart' ? 'Body Part' : 'Equipment'}
              </button>
            ))}
          </div>

          {filterType === 'bodyPart' && bodyParts && (
            <div className="flex flex-wrap gap-2">
              {bodyParts.map(part => (
                <button key={part} onClick={() => setSelected(part)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selected === part ? 'bg-red-600/20 border border-red-600 text-red-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}>{part}</button>
              ))}
            </div>
          )}

          {filterType === 'equipment' && equipment && (
            <div className="flex flex-wrap gap-2">
              {equipment.map(eq => (
                <button key={eq} onClick={() => setSelected(eq)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selected === eq ? 'bg-red-600/20 border border-red-600 text-red-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}>{eq}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-zinc-900" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {exercises?.map(ex => (
            <div key={ex.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-700/50 transition-all duration-300 group">
              <div className="relative h-40 bg-zinc-900 overflow-hidden cursor-pointer" onClick={() => setSelectedExercise(ex)}>
                {ex.gifUrl ? (
                  <Image src={ex.gifUrl} alt={ex.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">💪</div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleBookmark(ex) }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-zinc-400 hover:text-yellow-400 transition-all"
                >
                  {bookmarked.has(ex.id) ? <BookmarkCheck size={14} className="text-yellow-400" /> : <Bookmark size={14} />}
                </button>
              </div>
              <div className="p-3 cursor-pointer" onClick={() => setSelectedExercise(ex)}>
                <h3 className="text-sm font-bold text-white capitalize leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">{ex.name}</h3>
                <p className="text-xs text-zinc-600 mt-1 capitalize">{ex.bodyPart} · {ex.equipment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedExercise(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-black text-white capitalize">{selectedExercise.name}</h2>
                <button onClick={() => setSelectedExercise(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              {selectedExercise.gifUrl && (
                <div className="relative rounded-xl overflow-hidden bg-zinc-900 h-48 flex items-center justify-center">
                  <Image src={selectedExercise.gifUrl} alt={selectedExercise.name} fill unoptimized className="object-contain" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {[selectedExercise.bodyPart, selectedExercise.target, selectedExercise.equipment].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 rounded-full capitalize">{String(tag)}</span>
                ))}
              </div>
              {selectedExercise.instructions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase mb-3">Instructions</h3>
                  <ol className="space-y-2">
                    {selectedExercise.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-zinc-400">
                        <span className="text-red-500 font-bold shrink-0">{i + 1}.</span>
                        <span>{capitalize(step)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <button
                onClick={() => toggleBookmark(selectedExercise)}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                  bookmarked.has(selectedExercise.id)
                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-yellow-500/50 hover:text-yellow-400'
                }`}>
                {bookmarked.has(selectedExercise.id) ? '✓ Bookmarked' : '+ Bookmark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
