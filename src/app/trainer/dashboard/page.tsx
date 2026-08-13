'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

interface Request {
  id: string
  status: 'pending' | 'in_progress' | 'completed'
  request_type: string
  notes: string | null
  created_at: string
  member: { full_name: string | null; email: string } | null
}

const COLUMNS = [
  { key: 'pending', label: 'New Requests', color: 'blue', dot: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'yellow', dot: 'bg-yellow-500' },
  { key: 'completed', label: 'Plan Sent', color: 'green', dot: 'bg-green-500' },
] as const

export default function TrainerDashboard() {
  const supabase = createClient()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending')

  const loadRequests = React.useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('requests')
      .select('id, status, request_type, notes, created_at, member:member_id(full_name, email)')
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })
    setRequests((data as any) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => { await loadRequests() }
    init()
  }, [loadRequests])

  async function updateStatus(id: string, status: 'pending' | 'in_progress' | 'completed') {
    setUpdating(id)
    const { error } = await supabase.from('requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Failed to update')
    else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(`Status updated to ${status.replace('_', ' ')}`)
    }
    setUpdating(null)
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = requests.filter(r => r.status === col.key)
    return acc
  }, {} as Record<string, Request[]>)

  const RequestCard = ({ req, col }: { req: Request; col: typeof COLUMNS[number] }) => (
    <div className={`bg-zinc-950 border rounded-xl p-4 space-y-3 hover:border-zinc-600 transition-all ${
      col.key === 'pending' ? 'border-blue-900/40' :
      col.key === 'in_progress' ? 'border-yellow-900/40' : 'border-green-900/40'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-white text-sm">{(req.member as any)?.full_name || (req.member as any)?.email || 'Member'}</p>
          <p className="text-xs text-zinc-600">{new Date(req.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize shrink-0 ${
          req.request_type === 'both' ? 'bg-purple-500/20 text-purple-400' :
          req.request_type === 'workout' ? 'bg-red-500/20 text-red-400' :
          'bg-green-500/20 text-green-400'
        }`}>{req.request_type}</span>
      </div>

      {req.notes && (
        <p className="text-xs text-zinc-500 bg-zinc-900 rounded-lg p-2.5 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">{req.notes}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {col.key !== 'pending' && (
          <button disabled={updating === req.id} onClick={() => updateStatus(req.id, 'pending')}
            className="py-2 text-xs font-bold border border-zinc-800 text-zinc-500 hover:text-blue-400 hover:border-blue-800 rounded-lg transition-all">
            ← New
          </button>
        )}
        {col.key !== 'in_progress' && (
          <button disabled={updating === req.id} onClick={() => updateStatus(req.id, 'in_progress')}
            className="py-2 text-xs font-bold border border-zinc-800 text-zinc-500 hover:text-yellow-400 hover:border-yellow-800 rounded-lg transition-all">
            In Progress
          </button>
        )}
        {col.key !== 'completed' && (
          <button disabled={updating === req.id} onClick={() => updateStatus(req.id, 'completed')}
            className="py-2 text-xs font-bold border border-zinc-800 text-zinc-500 hover:text-green-400 hover:border-green-800 rounded-lg transition-all">
            ✓ Complete
          </button>
        )}
        <a href={`/trainer/workout-builder?member=${(req as any).member_id || ''}`}
          className="py-2 text-xs font-bold bg-red-600/10 border border-red-800/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all text-center col-span-1">
          Build Plan →
        </a>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Trainer HQ</p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">Client Requests</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadRequests} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map(col => (
          <div key={col.key} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <div className="text-3xl font-black text-white">{grouped[col.key]?.length || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <div className="text-xs text-zinc-500 font-semibold truncate">{col.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile: Tab switcher ─────────────────────── */}
      <div className="lg:hidden">
        {/* Tab pills */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-4">
          {COLUMNS.map(col => (
            <button
              key={col.key}
              onClick={() => setActiveTab(col.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all ${
                activeTab === col.key
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              <span className="truncate">{col.label}</span>
              <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === col.key ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'
              }`}>
                {grouped[col.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="h-4 bg-zinc-900 rounded w-3/4" />
                <div className="h-3 bg-zinc-900 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : grouped[activeTab]?.length === 0 ? (
          <div className="border border-zinc-800 border-dashed rounded-xl p-10 text-center text-zinc-700 text-sm">
            No requests in this column
          </div>
        ) : (
          <div className="space-y-3">
            {grouped[activeTab].map(req => {
              const col = COLUMNS.find(c => c.key === req.status)!
              return <RequestCard key={req.id} req={req} col={col} />
            })}
          </div>
        )}
      </div>

      {/* ── Desktop: Kanban ──────────────────────────── */}
      {loading ? (
        <div className="hidden lg:flex gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="space-y-3 flex-1">
              <div className="h-5 bg-zinc-900 rounded w-32 animate-pulse" />
              {[1, 2].map(i => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-zinc-900 rounded w-3/4" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="hidden lg:flex gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{col.label}</h2>
                <span className="ml-auto text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">{grouped[col.key]?.length}</span>
              </div>
              {grouped[col.key]?.length === 0 ? (
                <div className="border border-zinc-800 border-dashed rounded-xl p-6 text-center text-zinc-700 text-sm">
                  No requests here
                </div>
              ) : grouped[col.key]?.map(req => (
                <RequestCard key={req.id} req={req} col={col} />
              ))}
            </div>
          ))}
        </div>
      )}


    </div>
  )
}
