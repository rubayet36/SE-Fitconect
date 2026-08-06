'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, BookmarkX } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Bookmark {
  id: string
  exercise_db_id: string
  exercise_name: string
  exercise_gif: string | null
  created_at: string
}

export default function BookmarksPage() {
  const supabase = createClient()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Bookmark | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setBookmarks(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function removeBookmark(id: string, exerciseDbId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('exercise_db_id', exerciseDbId)
    setBookmarks(prev => prev.filter(b => b.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Bookmark removed')
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Saved</p>
        <h1 className="text-3xl font-black text-white mt-1">My Bookmarks</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-zinc-900" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🔖</div>
          <h2 className="text-xl font-bold text-white mb-2">No Bookmarks Yet</h2>
          <p className="text-zinc-500 text-sm max-w-sm">Explore exercises and bookmark the ones you like to save them here.</p>
          <a href="/member/explore"
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(225,29,29,0.4)]">
            Explore Exercises
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bookmarks.map(bm => (
            <div key={bm.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-yellow-700/40 transition-all duration-300 group">
              <div className="relative h-40 bg-zinc-900 overflow-hidden cursor-pointer" onClick={() => setSelected(bm)}>
                {bm.exercise_gif ? (
                  <Image src={bm.exercise_gif} alt={bm.exercise_name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">💪</div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removeBookmark(bm.id, bm.exercise_db_id) }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-yellow-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <BookmarkX size={14} />
                </button>
              </div>
              <div className="p-3 cursor-pointer" onClick={() => setSelected(bm)}>
                <h3 className="text-sm font-bold text-white capitalize leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">{bm.exercise_name}</h3>
                <p className="text-xs text-zinc-600 mt-1">{new Date(bm.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-white capitalize">{selected.exercise_name}</h2>
                <button onClick={() => setSelected(null)}><X size={18} className="text-zinc-500" /></button>
              </div>
              {selected.exercise_gif && (
                <div className="relative h-52 bg-zinc-900 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                  <Image src={selected.exercise_gif} alt={selected.exercise_name} fill unoptimized className="object-contain" />
                </div>
              )}
              <button
                onClick={() => removeBookmark(selected.id, selected.exercise_db_id)}
                className="w-full py-3 rounded-lg bg-red-950/30 border border-red-800/30 text-red-400 font-bold text-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <BookmarkX size={16} /> Remove Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
