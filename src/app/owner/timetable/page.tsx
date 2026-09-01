'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw,
  Clock,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Ban,
} from 'lucide-react'

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
  const [deleting, setDeleting] = useState<string | null>(null)

  // Edit form state
  const [editDayLabel, setEditDayLabel] = useState('')
  const [editOpenTime, setEditOpenTime] = useState('')
  const [editCloseTime, setEditCloseTime] = useState('')
  const [editIsClosed, setEditIsClosed] = useState(false)

  // New row form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDayLabel, setNewDayLabel] = useState('')
  const [newOpenTime, setNewOpenTime] = useState('6:00 AM')
  const [newCloseTime, setNewCloseTime] = useState('10:00 PM')
  const [newIsClosed, setNewIsClosed] = useState(false)
  const [adding, setAdding] = useState(false)

  const loadTimetable = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/timetable')
      const json = await res.json()
      if (json.data) setRows(json.data)
    } catch {
      toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTimetable()
  }, [loadTimetable])

  function startEdit(row: TimetableRow) {
    setEditingId(row.id)
    setEditDayLabel(row.day_label)
    setEditOpenTime(row.open_time)
    setEditCloseTime(row.close_time)
    setEditIsClosed(row.is_closed)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/timetable', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          day_label: editDayLabel,
          open_time: editOpenTime,
          close_time: editCloseTime,
          is_closed: editIsClosed,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update')
      toast.success('Timetable updated')
      setEditingId(null)
      loadTimetable()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/timetable', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete')
      toast.success('Timetable entry deleted')
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDayLabel.trim()) {
      toast.error('Please enter a day label')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/timetable', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_label: newDayLabel.trim(),
          open_time: newOpenTime,
          close_time: newCloseTime,
          is_closed: newIsClosed,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add entry')
      toast.success('Timetable entry added')
      setNewDayLabel('')
      setNewOpenTime('6:00 AM')
      setNewCloseTime('10:00 PM')
      setNewIsClosed(false)
      setShowAddForm(false)
      loadTimetable()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }
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
            <Clock className="text-red-500" size={28} /> Gym Timetable
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage gym operating hours displayed on the landing page</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTimetable}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all ${showAddForm
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(225,29,29,0.3)]'
              }`}
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            {showAddForm ? 'Cancel' : 'Add Slot'}
          </button>
        </div>
      </div>

      {/* Add new slot form */}
      {showAddForm && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">New Time Slot</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Day Label</label>
                <input
                  type="text"
                  required
                  value={newDayLabel}
                  onChange={e => setNewDayLabel(e.target.value)}
                  placeholder="e.g. Monday – Friday"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="newIsClosed"
                  checked={newIsClosed}
                  onChange={e => setNewIsClosed(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <label htmlFor="newIsClosed" className="text-sm font-semibold text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                  <Ban size={14} /> Mark as Closed
                </label>
              </div>
            </div>

            {!newIsClosed && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Open Time</label>
                  <input
                    type="text"
                    value={newOpenTime}
                    onChange={e => setNewOpenTime(e.target.value)}
                    placeholder="6:00 AM"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Close Time</label>
                  <input
                    type="text"
                    value={newCloseTime}
                    onChange={e => setNewCloseTime(e.target.value)}
                    placeholder="10:00 PM"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={adding}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold tracking-widest text-sm uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {adding ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Plus size={15} /> Add Slot</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Timetable rows */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-zinc-800 rounded w-40" />
                <div className="h-3 bg-zinc-800 rounded w-48" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
                <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Clock className="text-zinc-700 mb-3" size={40} />
          <h2 className="text-lg font-bold text-zinc-600">No Timetable Entries</h2>
          <p className="text-sm text-zinc-700 mt-1">Click &quot;Add Slot&quot; to create your first schedule entry.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div
              key={row.id}
              className={`group bg-zinc-950 border rounded-2xl p-5 transition-all ${row.is_closed
                  ? 'border-red-900/30 bg-red-950/5'
                  : 'border-zinc-800 hover:border-zinc-700'
                } ${editingId === row.id ? 'ring-1 ring-red-600/30' : ''}`}
            >
              {editingId === row.id ? (
                /* Editing mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Day Label</label>
                      <input
                        type="text"
                        value={editDayLabel}
                        onChange={e => setEditDayLabel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id={`edit-closed-${row.id}`}
                        checked={editIsClosed}
                        onChange={e => setEditIsClosed(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                      <label htmlFor={`edit-closed-${row.id}`} className="text-sm font-semibold text-zinc-400 cursor-pointer flex items-center gap-1.5">
                        <Ban size={14} /> Closed
                      </label>
                    </div>
                  </div>

                  {!editIsClosed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Open Time</label>
                        <input
                          type="text"
                          value={editOpenTime}
                          onChange={e => setEditOpenTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Close Time</label>
                        <input
                          type="text"
                          value={editCloseTime}
                          onChange={e => setEditCloseTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(row.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold rounded-lg hover:text-white hover:border-zinc-600 transition-all"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${row.is_closed ? 'bg-red-950/40 text-red-400' : 'bg-zinc-900 text-zinc-400'}`}>
                    <Clock size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{row.day_label}</p>
                    {row.is_closed ? (
                      <p className="text-red-400 text-xs font-semibold mt-0.5 flex items-center gap-1">
                        <Ban size={11} /> Closed
                      </p>
                    ) : (
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {row.open_time} – {row.close_time}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(row)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deleting === row.id}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-800/50 transition-all"
                    >
                      {deleting === row.id ? (
                        <div className="w-4 h-4 border-2 border-zinc-700 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <span className="text-blue-400 text-sm">💡</span>
        <p className="text-xs text-zinc-500">
          Changes are immediately reflected on the public landing page. Non-closed entries are shown to visitors.
        </p>
      </div>
    </div>
  )
}
