'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface UserObj {
  id: string
  full_name: string | null
  email: string
  created_at: string
  user_id_code?: string | null
}

export function UserList({ users, type }: { users: UserObj[], type: 'trainer' | 'member' }) {
  const router = useRouter()
  const supabase = createClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const colorClass = type === 'trainer' ? 'red' : 'blue'

  function startEdit(u: UserObj) {
    setEditingId(u.id)
    setEditName(u.full_name || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return }
    setSavingId(id)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim() })
      .eq('id', id)
    if (error) {
      toast.error('Failed to update name')
    } else {
      toast.success('Name updated')
      setEditingId(null)
      router.refresh()
    }
    setSavingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Successfully deleted ${type}`)
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to delete user')
      }
    } catch (err) {
      toast.error('Network error while deleting user')
    }
    setDeletingId(null)
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-zinc-600 text-sm">No {type}s yet</div>
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      {users.map(u => (
        <div key={u.id} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl group relative overflow-hidden">
          <div className={`w-8 h-8 rounded-full bg-${colorClass}-600/20 flex items-center justify-center text-${colorClass}-400 font-bold text-sm shrink-0`}>
            {(u.full_name || u.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {editingId === u.id ? (
              // ── Edit mode ─────────────────────────────────
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(u.id); if (e.key === 'Escape') cancelEdit() }}
                  className="flex-1 bg-zinc-800 border border-red-600/60 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600 min-w-0"
                />
                <button
                  onClick={() => saveEdit(u.id)}
                  disabled={savingId === u.id}
                  className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors shrink-0"
                >
                  {savingId === u.id
                    ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    : <Check size={13} />}
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1.5 rounded-lg bg-zinc-700/40 text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              // ── View mode ─────────────────────────────────
              <div className="flex items-center gap-1.5 group/name">
                <p className="text-sm font-semibold text-white truncate">{u.full_name || 'Unnamed'}</p>
                <button
                  onClick={() => startEdit(u)}
                  className="opacity-0 group-hover/name:opacity-100 p-0.5 text-zinc-600 hover:text-zinc-300 transition-all"
                  title="Edit name"
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              {type === 'member' && u.user_id_code && (
                <span className="text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/25 px-1.5 py-0.5 rounded tracking-wider shrink-0">
                  {u.user_id_code}
                </span>
              )}
              {type === 'member' && !u.user_id_code && (
                <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-600/20 px-1.5 py-0.5 rounded tracking-wider shrink-0">
                  No ID
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 shrink-0">
              {new Date(u.created_at).toLocaleDateString('en-GB')}
            </span>
            
            <button
              onClick={() => handleDelete(u.id, u.full_name || u.email)}
              disabled={deletingId === u.id}
              className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              title={`Delete ${type}`}
            >
              {deletingId === u.id ? (
                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
