'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  initialName: string
  greeting: string
}

export function DashboardHeader({ initialName, greeting }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!draft.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: draft.trim() })
      .eq('id', user.id)
    if (error) {
      toast.error('Could not save name')
    } else {
      setName(draft.trim())
      setEditing(false)
      toast.success('Name updated!')
      router.refresh()
    }
    setSaving(false)
  }

  function cancel() {
    setDraft(name)
    setEditing(false)
  }

  return (
    <div>
      <p className="text-zinc-500 text-sm font-medium">{greeting} 👋</p>

      {editing ? (
        /* ── Edit mode ── */
        <div className="flex items-center gap-2 mt-1">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            className="text-3xl font-black bg-transparent border-b-2 border-red-600 text-white focus:outline-none w-full max-w-xs leading-tight pb-0.5"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={save}
            disabled={saving}
            className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors shrink-0"
            title="Save"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              : <Check size={16} />}
          </button>
          <button
            onClick={cancel}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white transition-colors shrink-0"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-3xl font-black text-white">
            {name.split(' ')[0] || 'Athlete'}
          </h1>
          <button
            onClick={() => { setDraft(name); setEditing(true) }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Edit your name"
          >
            <Pencil size={12} />
            <span className="text-xs font-semibold">Edit</span>
          </button>
        </div>
      )}

      <p className="text-zinc-600 text-sm mt-1">Ready to crush today?</p>
    </div>
  )
}
