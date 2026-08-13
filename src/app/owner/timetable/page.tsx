'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Clock, Edit2, Check, X, Plus, Trash2 } from 'lucide-react'

interface TimetableRow {
  id: string
  day_label: string
  open_time: string
  close_time: string
  is_closed: boolean
  display_order: number
}

export default function OwnerTimetablePage() {
  const [rows, setRows] = useState<TimetableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ day_label: '', open_time: '', close_time: '', is_closed: false })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ day_label: '', open_time: '8:00 AM', close_time: '6:00 PM', is_closed: false })

  const loadTimetable = React.useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/timetable')
    const json = await res.json()
    setRows(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => { await loadTimetable() }
    init()
  }, [loadTimetable])

  function startEdit(row: TimetableRow) {
    setEditingId(row.id)
    setEditForm({ day_label: row.day_label, open_time: row.open_time, close_time: row.close_time, is_closed: row.is_closed })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch('/api/timetable', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm })
    })
    if (res.ok) {
      toast.success('Timetable updated!')
      setEditingId(null)
      await loadTimetable()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to save')
    }
    setSaving(false)
  }

  async function saveAdd() {
    if (!addForm.day_label.trim()) { toast.error('Day label required'); return }
    setSaving(true)
    const res = await fetch('/api/timetable', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm)
    })
    if (res.ok) {
      toast.success('Row added!')
      setShowAdd(false)
      setAddForm({ day_label: '', open_time: '8:00 AM', close_time: '6:00 PM', is_closed: false })
      await loadTimetable()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to add')
    }
    setSaving(false)
  }

  async function deleteRow(id: string) {
    const res = await fetch('/api/timetable', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) { toast.success('Row removed'); await loadTimetable() }
    else toast.error('Failed to delete')
  }

  const inputCls = "bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-600 transition-colors"

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Owner Panel</p>
          <h1 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
            <Clock className="text-red-500" size={28} /> Gym Timetable
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Changes appear immediately on the Member Dashboard</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all">
          <Plus size={16} /> Add Row
        </button>
      </div>

      {showAdd && (
        <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold text-sm tracking-widest uppercase">New Timetable Row</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Day / Label</label>
              <input type="text" placeholder="e.g. Saturday" value={addForm.day_label}
                onChange={e => setAddForm(f => ({ ...f, day_label: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Open Time</label>
              <input type="text" placeholder="6:00 AM" value={addForm.open_time}
                onChange={e => setAddForm(f => ({ ...f, open_time: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Close Time</label>
              <input type="text" placeholder="10:00 PM" value={addForm.close_time}
                onChange={e => setAddForm(f => ({ ...f, close_time: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="addClosed" checked={addForm.is_closed}
                onChange={e => setAddForm(f => ({ ...f, is_closed: e.target.checked }))}
                className="w-4 h-4 accent-red-600" />
              <label htmlFor="addClosed" className="text-sm text-zinc-400">Closed this day</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={saving}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all">
              {saving ? 'Saving...' : 'Add Row'}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-sm font-bold rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Changes appear live on Member Dashboard
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <div className="h-4 bg-zinc-800 rounded w-40" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl text-zinc-600">
          No timetable rows. Add one above.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 lg:p-5">
              {editingId === row.id ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Day / Label</label>
                      <input type="text" value={editForm.day_label}
                        onChange={e => setEditForm(f => ({ ...f, day_label: e.target.value }))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Open Time</label>
                      <input type="text" value={editForm.open_time}
                        onChange={e => setEditForm(f => ({ ...f, open_time: e.target.value }))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Close Time</label>
                      <input type="text" value={editForm.close_time}
                        onChange={e => setEditForm(f => ({ ...f, close_time: e.target.value }))}
                        className={`w-full ${inputCls}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input type="checkbox" checked={editForm.is_closed}
                        onChange={e => setEditForm(f => ({ ...f, is_closed: e.target.checked }))}
                        className="w-4 h-4 accent-red-600" />
                      Closed this day
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(row.id)} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all">
                        <Check size={13} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-lg transition-all">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-sm">{row.day_label}</p>
                    {row.is_closed ? (
                      <p className="text-xs text-red-400 font-semibold mt-0.5">Closed</p>
                    ) : (
                      <p className="text-xs text-zinc-400 mt-0.5">{row.open_time} – {row.close_time}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(row)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-bold rounded-lg transition-all">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => deleteRow(row.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
