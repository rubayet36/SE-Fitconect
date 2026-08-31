'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RefreshCw, Megaphone, Plus, Trash2, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react'

type NoticeType = 'info' | 'warning' | 'success'

interface Notice {
  id: string
  title: string
  body: string
  type: NoticeType
  created_at: string
}

const TYPE_OPTIONS: { value: NoticeType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; selectedBg: string; selectedText: string; selectedBorder: string }[] = [
  { value: 'info', label: 'Info', icon: Info, selectedBg: 'bg-blue-600/20', selectedText: 'text-blue-400', selectedBorder: 'border-blue-600/50' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, selectedBg: 'bg-yellow-600/20', selectedText: 'text-yellow-400', selectedBorder: 'border-yellow-600/50' },
  { value: 'success', label: 'Success', icon: CheckCircle2, selectedBg: 'bg-green-600/20', selectedText: 'text-green-400', selectedBorder: 'border-green-600/50' },
]

export default function OwnerBillboardPage() {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [noticeType, setNoticeType] = useState<NoticeType>('info')
  const [posting, setPosting] = useState(false)

  const loadNotices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_notices')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setNotices((data as Notice[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadNotices()
  }, [loadNotices])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both the title and body')
      return
    }

    setPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); return }

      const { error } = await supabase.from('gym_notices').insert({
        title: title.trim(),
        body: body.trim(),
        type: noticeType,
        created_by: user.id,
      })

      if (error) throw error

      toast.success('Notice posted successfully!')
      setTitle('')
      setBody('')
      setNoticeType('info')
      setShowForm(false)
      loadNotices()
    } catch (err: any) {
      toast.error(err.message || 'Failed to post notice')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const { error } = await supabase.from('gym_notices').delete().eq('id', id)
      if (error) throw error
      toast.success('Notice deleted')
      setNotices(prev => prev.filter(n => n.id !== id))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete notice')
    } finally {
      setDeleting(null)
    }
  }

  const typeConfig = (type: NoticeType) =>
    type === 'success' ? 'bg-green-950/20 border-green-800/30' :
    type === 'warning' ? 'bg-yellow-950/20 border-yellow-800/30' :
    'bg-blue-950/20 border-blue-800/30'

  const typeText = (type: NoticeType) =>
    type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400'

  const typeBadge = (type: NoticeType) =>
    type === 'success' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
    type === 'warning' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
    'bg-blue-500/15 text-blue-400 border-blue-500/30'

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold flex items-center gap-2">
            <span className="w-4 h-[2px] bg-red-600 rounded-full" />
            Owner Panel
          </p>
          <h1 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
            <Megaphone className="text-red-500" size={28} /> Gym Billboard
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Post and manage gym-wide announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadNotices}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all ${
              showForm
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(225,29,29,0.3)]'
            }`}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancel' : 'Post Notice'}
          </button>
        </div>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">New Announcement</h2>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Announcement title…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Body</label>
              <textarea
                required
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your announcement here…"
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Type</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const isSelected = noticeType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNoticeType(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? `${opt.selectedBg} ${opt.selectedText} ${opt.selectedBorder}`
                          : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Icon size={13} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={posting}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold tracking-widest text-sm uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {posting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Megaphone size={15} /> Publish Notice</>
              )}
            </button>
          </form>
        </div>
      )}

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
          <p className="text-sm text-zinc-700 mt-1">Click &quot;Post Notice&quot; above to create your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`group relative p-5 rounded-xl border ${typeConfig(notice.type)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${typeBadge(notice.type)}`}>
                      {notice.type}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm ${typeText(notice.type)}`}>{notice.title}</h3>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap">{notice.body}</p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(notice.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(notice.id)}
                  disabled={deleting === notice.id}
                  className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-800/50 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                >
                  {deleting === notice.id ? (
                    <div className="w-4 h-4 border-2 border-zinc-700 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
