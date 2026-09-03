'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Bookmark,
  BookmarkX,
  Search,
  Dumbbell,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal'

interface Bookmark {
  id: string
  exercise_db_id: string
  exercise_name: string
  exercise_gif: string | null
  created_at: string
}

export default function BookmarksPage() {
  const supabase = useMemo(() => createClient(), [])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Bookmark | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Load saved bookmarks for current user
  useEffect(() => {
    async function loadBookmarks() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookmarks(data || [])
      } catch (err: any) {
        console.error('Failed to load bookmarks:', err)
        toast.error('Failed to load saved bookmarks')
      } finally {
        setLoading(false)
      }
    }
    loadBookmarks()
  }, [supabase])

  // One-click remove bookmark
  async function removeBookmark(id: string, exerciseDbId: string, name: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Optimistic UI update
    const prevList = [...bookmarks]
    setBookmarks(prev => prev.filter(b => b.id !== id))
    if (selectedExercise?.id === id) {
      setModalOpen(false)
      setSelectedExercise(null)
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_db_id', exerciseDbId)

      if (error) throw error
      toast.success(`Removed "${name}" from bookmarks`)
    } catch (err: any) {
      setBookmarks(prevList)
      toast.error('Failed to remove bookmark: ' + err.message)
    }
  }

  // Filter bookmarks by query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks
    const q = searchQuery.toLowerCase().trim()
    return bookmarks.filter(b => b.exercise_name.toLowerCase().includes(q))
  }, [bookmarks, searchQuery])

  function handleCardClick(bm: Bookmark) {
    setSelectedExercise(bm)
    setModalOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
              <Bookmark size={11} /> Saved Library
            </span>
            <span className="text-zinc-500 text-xs">
              {bookmarks.length} {bookmarks.length === 1 ? 'Exercise' : 'Exercises'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            My Bookmarked Exercises
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Quick-access catalog of saved movements with animated demonstration GIFs, execution steps, and technique safety guidelines.
          </p>
        </div>

        <Link
          href="/member/explore"
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Dumbbell size={14} className="text-red-400" />
          Explore More Exercises
        </Link>
      </div>

      {/* Search & Stats Bar */}
      {bookmarks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search saved exercises by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>

          <div className="text-xs text-zinc-500 self-end sm:self-auto font-mono">
            Showing <span className="text-white font-bold">{filteredBookmarks.length}</span> of {bookmarks.length}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-zinc-900" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-900 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        /* Empty State */
        <div className="bg-gradient-to-b from-zinc-950 to-zinc-900/60 border border-zinc-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 my-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🔖
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">No Bookmarked Exercises Yet</h2>
            <p className="text-zinc-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
              Explore our comprehensive movement catalog of 800+ exercises and bookmark your favorite drills to quickly view their form and safety guides during workouts.
            </p>
          </div>
          <Link
            href="/member/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)]"
          >
            <Sparkles size={14} />
            Explore Exercise Catalog
          </Link>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs">
          No bookmarked exercises match &quot;{searchQuery}&quot;
        </div>
      ) : (
        /* Grid of Bookmarked Exercises */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBookmarks.map(bm => (
            <div
              key={bm.id}
              className="bg-zinc-950 border border-zinc-800/90 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 group shadow-lg flex flex-col justify-between"
            >
              {/* Media Preview Box */}
              <div
                className="relative h-44 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden cursor-pointer"
                onClick={() => handleCardClick(bm)}
              >
                {bm.exercise_gif ? (
                  <Image
                    src={bm.exercise_gif}
                    alt={bm.exercise_name}
                    fill
                    unoptimized
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">
                    💪
                  </div>
                )}

                {/* One-Click Unbookmark Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBookmark(bm.id, bm.exercise_db_id, bm.exercise_name)
                  }}
                  title="Remove Bookmark"
                  className="absolute top-2.5 right-2.5 p-2 bg-black/70 hover:bg-red-600/90 text-yellow-400 hover:text-white rounded-xl backdrop-blur-sm transition-all border border-zinc-800 shadow-md"
                >
                  <BookmarkX size={14} />
                </button>

                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-zinc-400">
                  Tap to Inspect
                </div>
              </div>

              {/* Title & Metadata */}
              <div
                className="p-4 cursor-pointer space-y-2.5"
                onClick={() => handleCardClick(bm)}
              >
                <h3 className="text-xs sm:text-sm font-bold text-white capitalize leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
                  {bm.exercise_name}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                  <span>Saved {new Date(bm.created_at).toLocaleDateString()}</span>
                  <span className="text-yellow-400/80 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Guide &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Integration */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={{
            exercise_db_id: selectedExercise.exercise_db_id,
            exercise_name: selectedExercise.exercise_name,
            gifUrl: selectedExercise.exercise_gif,
          }}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedExercise(null)
          }}
          onBookmarkChange={(isBookmarkedNow, dbId) => {
            if (!isBookmarkedNow) {
              setBookmarks(prev => prev.filter(b => b.exercise_db_id !== dbId))
              setModalOpen(false)
              setSelectedExercise(null)
            }
          }}
        />
      )}
    </div>
  )
}
