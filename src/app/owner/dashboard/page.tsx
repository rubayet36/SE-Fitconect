'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  RefreshCw,
  Users,
  Crown,
  UserPlus,
  Megaphone,
  Clock,
  ClipboardList,
  CheckCircle2,
  Inbox,
  Activity,
  Dumbbell,
  Salad,
  Zap,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Profile {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url: string | null
  created_at: string
}

interface Request {
  id: string
  member_id: string
  trainer_id: string
  status: 'pending' | 'in_progress' | 'completed'
  request_type: 'diet' | 'workout' | 'both'
  notes: string | null
  created_at: string
  member: { full_name: string | null; email: string } | null
  trainer: { full_name: string | null; email: string } | null
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', dot: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
} as const

const TYPE_CONFIG = {
  both: { label: 'Full Plan', badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30', icon: Zap },
  workout: { label: 'Workout', badge: 'bg-red-500/15 text-red-400 border-red-500/30', icon: Dumbbell },
  diet: { label: 'Diet', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Salad },
} as const

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-red-600 to-rose-700',
  'from-violet-600 to-purple-700',
  'from-blue-600 to-cyan-700',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-700',
  'from-pink-600 to-fuchsia-700',
]

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function OwnerDashboard() {
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  // ── Load data ──────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profilesRes, requestsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, role, avatar_url, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('requests')
          .select('id, member_id, trainer_id, status, request_type, notes, created_at, member:member_id(full_name, email), trainer:trainer_id(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      if (profilesRes.error) toast.error('Failed to load profiles')
      if (requestsRes.error) toast.error('Failed to load requests')

      setProfiles((profilesRes.data as Profile[]) || [])
      setRequests((requestsRes.data as any) || [])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Derived state ──────────────────────────

  const members = useMemo(() => profiles.filter(p => p.role === 'member'), [profiles])
  const trainers = useMemo(() => profiles.filter(p => p.role === 'trainer'), [profiles])
  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const inProgressRequests = useMemo(() => requests.filter(r => r.status === 'in_progress'), [requests])
  const completedRequests = useMemo(() => requests.filter(r => r.status === 'completed'), [requests])
  const recentRequests = useMemo(() => requests.slice(0, 8), [requests])

  // Trainer stats: how many requests each trainer has
  const trainerStats = useMemo(() => {
    const map = new Map<string, { total: number; pending: number; inProgress: number; completed: number }>()
    for (const req of requests) {
      const prev = map.get(req.trainer_id) || { total: 0, pending: 0, inProgress: 0, completed: 0 }
      prev.total++
      if (req.status === 'pending') prev.pending++
      else if (req.status === 'in_progress') prev.inProgress++
      else prev.completed++
      map.set(req.trainer_id, prev)
    }
    return map
  }, [requests])

  // ── Render ─────────────────────────────────

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold flex items-center gap-2">
            <span className="w-4 h-[2px] bg-red-600 rounded-full" />
            Owner HQ
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1.5">Gym Command Center</h1>
          <p className="text-zinc-600 text-sm mt-1">Overview of all members, trainers, and requests</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: members.length, icon: Users, bg: 'from-zinc-900 to-zinc-950', border: 'border-zinc-800', color: 'text-white', dot: 'bg-zinc-500', iconBg: 'bg-zinc-800' },
          { label: 'Total Trainers', value: trainers.length, icon: Crown, bg: 'from-violet-950/30 to-zinc-950', border: 'border-violet-900/40', color: 'text-violet-400', dot: 'bg-violet-500', iconBg: 'bg-violet-950/50' },
          { label: 'Pending Requests', value: pendingRequests.length, icon: Inbox, bg: 'from-blue-950/30 to-zinc-950', border: 'border-blue-900/40', color: 'text-blue-400', dot: 'bg-blue-500', iconBg: 'bg-blue-950/50' },
          { label: 'Completed Plans', value: completedRequests.length, icon: CheckCircle2, bg: 'from-emerald-950/30 to-zinc-950', border: 'border-emerald-900/40', color: 'text-emerald-400', dot: 'bg-emerald-500', iconBg: 'bg-emerald-950/50' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-2xl p-4 hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.iconBg} ${stat.color}`}><Icon size={16} /></div>
                <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
              </div>
              {loading
                ? <div className="h-9 w-12 bg-zinc-800 rounded animate-pulse" />
                : <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              }
              <div className="text-xs text-zinc-600 font-semibold mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Quick action links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/owner/create-trainer"
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,29,0.3)] hover:shadow-[0_0_25px_rgba(225,29,29,0.4)]"
        >
          <UserPlus size={15} /> Add Trainer
        </Link>
        <Link
          href="/owner/billboard"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 font-bold text-sm rounded-xl transition-all"
        >
          <Megaphone size={15} /> Billboard
        </Link>
        <Link
          href="/owner/timetable"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 font-bold text-sm rounded-xl transition-all"
        >
          <Clock size={15} /> Timetable
        </Link>
      </div>

      {/* Request Distribution Mini Bar */}
      {!loading && requests.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <TrendingUp size={15} className="text-red-400" />
              Request Distribution
            </h2>
            <span className="text-xs text-zinc-600 font-semibold">{requests.length} total</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-zinc-900">
            {pendingRequests.length > 0 && (
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(pendingRequests.length / requests.length) * 100}%` }}
                title={`${pendingRequests.length} pending`}
              />
            )}
            {inProgressRequests.length > 0 && (
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${(inProgressRequests.length / requests.length) * 100}%` }}
                title={`${inProgressRequests.length} in progress`}
              />
            )}
            {completedRequests.length > 0 && (
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedRequests.length / requests.length) * 100}%` }}
                title={`${completedRequests.length} completed`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Pending ({pendingRequests.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress ({inProgressRequests.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({completedRequests.length})</span>
          </div>
        </div>
      )}

      {/* Two-column layout: Trainers + Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Trainers Roster — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Crown size={14} className="text-violet-400" />
              Trainers ({trainers.length})
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trainers.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
              <Crown size={32} className="text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 font-semibold text-sm">No trainers yet</p>
              <p className="text-zinc-700 text-xs mt-1">Add your first trainer via the button above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainers.map(trainer => {
                const stats = trainerStats.get(trainer.id)
                return (
                  <div
                    key={trainer.id}
                    className="group bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 hover:border-zinc-700 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(trainer.id)} flex items-center justify-center font-black text-white text-sm shrink-0 shadow-lg select-none`}>
                        {getInitials(trainer.full_name, trainer.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate group-hover:text-violet-400 transition-colors">
                          {trainer.full_name || 'Unnamed Trainer'}
                        </p>
                        <p className="text-[11px] text-zinc-600 truncate">{trainer.email}</p>
                      </div>
                      <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
                    </div>

                    {stats && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                          <ClipboardList size={10} /> {stats.total} reqs
                        </span>
                        {stats.pending > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-950/30 border border-blue-900/30 text-[10px] font-bold text-blue-400">
                            <Inbox size={10} /> {stats.pending}
                          </span>
                        )}
                        {stats.inProgress > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/30 border border-amber-900/30 text-[10px] font-bold text-amber-400">
                            <Activity size={10} /> {stats.inProgress}
                          </span>
                        )}
                        {stats.completed > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/30 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 size={10} /> {stats.completed}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Requests — 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="text-blue-400" />
              Recent Requests
            </h2>
            <span className="text-xs text-zinc-600 font-semibold">{requests.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                    <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
              <Inbox size={32} className="text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 font-semibold text-sm">No requests yet</p>
              <p className="text-zinc-700 text-xs mt-1">Requests will appear here once members submit plan requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(req => {
                const statusCfg = STATUS_CONFIG[req.status]
                const typeCfg = TYPE_CONFIG[req.request_type]
                const TypeIcon = typeCfg.icon
                const memberName = (req.member as any)?.full_name || (req.member as any)?.email || 'Unknown'
                const trainerName = (req.trainer as any)?.full_name || (req.trainer as any)?.email || 'Unassigned'

                return (
                  <div
                    key={req.id}
                    className="group bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 hover:border-zinc-700 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(req.member_id)} flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg select-none`}>
                        {getInitials((req.member as any)?.full_name, (req.member as any)?.email || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{memberName}</p>
                        <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                          Trainer: <span className="text-zinc-500">{trainerName}</span>
                        </p>
                        {req.notes && (
                          <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">{req.notes}</p>
                        )}
                        <p className="text-[10px] text-zinc-700 mt-1 flex items-center gap-1">
                          <Clock size={9} /> {timeAgo(req.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border flex items-center gap-1 ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${req.status === 'pending' ? 'animate-pulse' : ''}`} />
                          {statusCfg.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border flex items-center gap-1 ${typeCfg.badge}`}>
                          <TypeIcon size={9} />
                          {typeCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
