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
}
