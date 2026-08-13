'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, RefreshCw, Megaphone } from 'lucide-react'

type NoticeType = 'info' | 'warning' | 'success'

interface Notice {
  id: string
  title: string
  body: string
  type: NoticeType
  created_at: string
}

const TYPE_OPTIONS: { value: NoticeType; label: string; color: string }[] = [
  { value: 'info', label: '📘 Info', color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { value: 'warning', label: '⚠️ Warning', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
  { value: 'success', label: '✅ Success', color: 'bg-green-500/20 border-green-500 text-green-400' },
]

export default function OwnerBillboardPage() {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 'info' as NoticeType })

  const loadNotices = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('gym_notices').select('*').order('created_at', { ascending: false })
    if (!error) setNotices((data as Notice[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => { await loadNotices() }
    init()
  }, [loadNotices])

  async function handleAdd() {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and message are required'); return }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gym_notices').insert({
      title: form.title.trim(), body: form.body.trim(), type: form.type, created_by: user?.id ?? null,
    })
    if (error) {
      toast.error('Failed to post notice: ' + error.message)
    } else {
      toast.success('Notice posted to member billboard!')
      setForm({ title: '', body: '', type: 'info' })
      setShowForm(false)
      await loadNotices()
      try {
        fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'broadcast', title: '📢 ' + form.title.trim(), message: form.body.trim() }),
        }).then(r => r.json()).then(data => {
          if (data.success && data.sentCount > 0) toast.success(`📲 Push sent to ${data.sentCount} device(s)`)
        }).catch(() => {})
      } catch { /* silent */ }
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await supabase.from('gym_notices').delete().eq('id', id)
    if (error) toast.error('Failed to delete')
    else { setNotices(prev => prev.filter(n => n.id !== id)); toast.success('Notice removed') }
    setDeleting(null)
  }

  const typeConfig = (type: NoticeType) =>
    type === 'success' ? 'bg-green-950/20 border-green-800/30' :
    type === 'warning' ? 'bg-yellow-950/20 border-yellow-800/30' :
    'bg-blue-950/20 border-blue-800/30'
  const typeText = (type: NoticeType) =>
    type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400'

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Owner Panel</p>
          <h1 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
            <Megaphone className="text-red-500" size={28} /> Gym Billboard
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Post announcements visible to all members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadNotices} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-red-600/30">
            <Plus size={16} /> New Notice
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm tracking-widest uppercase">New Announcement</h2>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Title</label>
            <input type="text" placeholder="e.g. New Equipment Arrived!" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Message</label>
            <textarea rows={3} placeholder="Write the announcement body..." value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 block">Type</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.type === opt.value ? opt.color : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all">
              {submitting ? 'Posting...' : 'Post Notice'}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ title: '', body: '', type: 'info' }) }}
              className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-sm font-bold rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Notices appear instantly on the Member Dashboard
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-40" /><div className="h-3 bg-zinc-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Megaphone className="text-zinc-700 mb-3" size={40} />
          <h2 className="text-lg font-bold text-zinc-600">No Notices Yet</h2>
          <p className="text-sm text-zinc-700 mt-1">Click &quot;New Notice&quot; to post your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div key={notice.id} className={`flex items-start justify-between gap-4 p-5 rounded-xl border ${typeConfig(notice.type)}`}>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm ${typeText(notice.type)}`}>{notice.title}</h3>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{notice.body}</p>
                <p className="text-xs text-zinc-600 mt-2">
                  {new Date(notice.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => handleDelete(notice.id)} disabled={deleting === notice.id}
                className="shrink-0 p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all">
                {deleting === notice.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
