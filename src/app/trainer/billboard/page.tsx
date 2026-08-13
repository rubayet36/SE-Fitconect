'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Megaphone } from 'lucide-react'

type NoticeType = 'info' | 'warning' | 'success'

interface Notice {
  id: string
  title: string
  body: string
  type: NoticeType
  created_at: string
}

export default function TrainerBillboardPage() {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotices = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_notices')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setNotices((data as Notice[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => { await loadNotices() }
    init()
  }, [loadNotices])

  const typeConfig = (type: NoticeType) =>
    type === 'success' ? 'bg-green-950/20 border-green-800/30' :
    type === 'warning' ? 'bg-yellow-950/20 border-yellow-800/30' :
    'bg-blue-950/20 border-blue-800/30'
  const typeText = (type: NoticeType) =>
    type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400'

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Trainer View</p>
          <h1 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
            <Megaphone className="text-red-500" size={28} /> Gym Billboard
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Owner announcements for all members</p>
        </div>
        <button
          onClick={loadNotices}
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <span className="text-yellow-400 text-sm">🔒</span>
        <p className="text-xs text-zinc-500">Only the gym owner can post or remove notices.</p>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-40" />
              <div className="h-3 bg-zinc-800 rounded w-full" />
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Megaphone className="text-zinc-700 mb-3" size={40} />
          <h2 className="text-lg font-bold text-zinc-600">No Notices Yet</h2>
          <p className="text-sm text-zinc-700 mt-1">The owner hasn't posted any announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`p-5 rounded-xl border ${typeConfig(notice.type)}`}
            >
              <h3 className={`font-bold text-sm ${typeText(notice.type)}`}>{notice.title}</h3>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{notice.body}</p>
              <p className="text-xs text-zinc-600 mt-2">
                {new Date(notice.created_at).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
