'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  RefreshCw,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  Dumbbell,
  Salad,
  Zap,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  Inbox,
  AlertCircle,
  User,
  Activity,
  TrendingUp,
  X,
} from 'lucide-react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MemberProfile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone: string | null
  created_at: string
}

interface Request {
  id: string
  member_id: string
  status: 'pending' | 'in_progress' | 'completed'
  request_type: 'diet' | 'workout' | 'both'
  notes: string | null
  created_at: string
  updated_at: string
  member: MemberProfile | null
}

interface ClientMetrics {
  memberId: string
  totalRequests: number
  pendingRequests: number
  inProgressRequests: number
  completedRequests: number
  workoutDays: number
  dietMeals: number
  lastActivity: string | null
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'New Requests',
    shortLabel: 'New',
    color: 'blue',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    accentBar: 'bg-blue-500',
    glow: 'shadow-blue-500/10',
    columnBorder: 'border-blue-500/50',
    icon: Inbox,
  },
  in_progress: {
    label: 'In Progress',
    shortLabel: 'Active',
    color: 'amber',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    accentBar: 'bg-amber-500',
    glow: 'shadow-amber-500/10',
    columnBorder: 'border-amber-500/50',
    icon: Activity,
  },
  completed: {
    label: 'Plan Sent',
    shortLabel: 'Done',
    color: 'emerald',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    accentBar: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10',
    columnBorder: 'border-emerald-500/50',
    icon: CheckCircle2,
  },
} as const

const TYPE_CONFIG = {
  both: { label: 'Full Plan', badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30', icon: Zap },
  workout: { label: 'Workout', badge: 'bg-red-500/15 text-red-400 border-red-500/30', icon: Dumbbell },
  diet: { label: 'Diet', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Salad },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-red-600 to-rose-700',
  'from-violet-600 to-purple-700',
  'from-blue-600 to-cyan-700',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-700',
  'from-pink-600 to-fuchsia-700',
]

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
// Client Avatar
// ──────────────────────────────────────────────

function ClientAvatar({ member, size = 'md' }: { member: MemberProfile; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br ${getAvatarColor(member.id)} flex items-center justify-center font-black text-white shrink-0 shadow-lg select-none`}>
      {getInitials(member.full_name, member.email)}
    </div>
  )
}

// ──────────────────────────────────────────────
// Metric Chip
// ──────────────────────────────────────────────

function MetricChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
      <Icon size={12} className={color} />
      <span className="text-xs font-bold text-white">{value}</span>
      <span className="text-[10px] text-zinc-600">{label}</span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Request Card
// ──────────────────────────────────────────────

function RequestCard({
  req,
  status,
  updating,
  onUpdateStatus,
}: {
  req: Request
  status: StatusKey
  updating: string | null
  onUpdateStatus: (id: string, status: StatusKey) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const typeCfg = TYPE_CONFIG[req.request_type]
  const TypeIcon = typeCfg.icon
  const member = req.member
  const isUpdating = updating === req.id

  return (
    <div className={`group relative bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5
      hover:border-zinc-700 hover:shadow-xl ${cfg.glow} transition-all duration-300
      ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Accent top bar */}
      <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-b-full ${cfg.accentBar} opacity-50 group-hover:opacity-100 transition-opacity`} />

      {/* Member row */}
      <div className="flex items-start gap-3 pt-1">
        {member && <ClientAvatar member={member} size="sm" />}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">
            {member?.full_name || member?.email || 'Unknown Member'}
          </p>
          {member?.full_name && (
            <p className="text-[11px] text-zinc-600 truncate">{member.email}</p>
          )}
          <p className="text-[11px] text-zinc-700 mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {timeAgo(req.created_at)}
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize border flex items-center gap-1.5 shrink-0 ${typeCfg.badge}`}>
          <TypeIcon size={10} />
          {typeCfg.label}
        </span>
      </div>

      {/* Notes */}
      {req.notes && (
        <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-xl px-3 py-2.5">
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">{req.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {status !== 'pending' && (
          <button
            onClick={() => onUpdateStatus(req.id, 'pending')}
            className="py-2 text-[11px] font-bold border border-zinc-800 text-zinc-500 hover:text-blue-400 hover:border-blue-800/60 hover:bg-blue-950/20 rounded-xl transition-all"
          >
            ← New
          </button>
        )}
        {status !== 'in_progress' && (
          <button
            onClick={() => onUpdateStatus(req.id, 'in_progress')}
            className="py-2 text-[11px] font-bold border border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-800/60 hover:bg-amber-950/20 rounded-xl transition-all"
          >
            In Progress
          </button>
        )}
        {status !== 'completed' && (
          <button
            onClick={() => onUpdateStatus(req.id, 'completed')}
            className="py-2 text-[11px] font-bold border border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-800/60 hover:bg-emerald-950/20 rounded-xl transition-all"
          >
            ✓ Complete
          </button>
        )}
        <a
          href={`/trainer/workout-builder?member=${req.member_id}`}
          className="py-2 text-[11px] font-bold bg-red-600/10 border border-red-800/30 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl transition-all text-center flex items-center justify-center gap-1"
        >
          Build Plan <ArrowUpRight size={10} />
        </a>
      </div>

      {/* Spinner overlay */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Client Roster Card
// ──────────────────────────────────────────────

function ClientRosterCard({
  member,
  metrics,
  requests,
  onSelect,
}: {
  member: MemberProfile
  metrics: ClientMetrics
  requests: Request[]
  onSelect: (id: string) => void
}) {
  const latestReq = requests[0]
  return (
    <div
      onClick={() => onSelect(member.id)}
      className="group relative bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/0 to-transparent group-hover:from-red-950/10 transition-all duration-300 pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <ClientAvatar member={member} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm truncate group-hover:text-red-400 transition-colors">
            {member.full_name || 'Unnamed Member'}
          </p>
          <p className="text-[11px] text-zinc-600 truncate">{member.email}</p>
        </div>
        <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>

      {/* Latest request status */}
      {latestReq && (
        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border mb-3 ${STATUS_CONFIG[latestReq.status].badge}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[latestReq.status].dot} ${latestReq.status === 'pending' ? 'animate-pulse' : ''}`} />
          {STATUS_CONFIG[latestReq.status].label}
        </div>
      )}

      {/* Metrics chips */}
      <div className="flex flex-wrap gap-1.5">
        <MetricChip icon={ClipboardList} value={metrics.totalRequests} label="reqs" color="text-zinc-400" />
        {metrics.workoutDays > 0 && (
          <MetricChip icon={Dumbbell} value={metrics.workoutDays} label="days" color="text-red-400" />
        )}
        {metrics.dietMeals > 0 && (
          <MetricChip icon={Salad} value={metrics.dietMeals} label="meals" color="text-emerald-400" />
        )}
        {metrics.pendingRequests > 0 && (
          <MetricChip icon={AlertCircle} value={metrics.pendingRequests} label="pending" color="text-blue-400" />
        )}
      </div>

      {metrics.lastActivity && (
        <p className="text-[10px] text-zinc-700 mt-2.5 flex items-center gap-1">
          <Clock size={9} />
          Last: {timeAgo(metrics.lastActivity)}
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Member Detail Modal
// ──────────────────────────────────────────────

function MemberDetailModal({
  member,
  metrics,
  requests,
  updating,
  onClose,
  onUpdateStatus,
}: {
  member: MemberProfile
  metrics: ClientMetrics
  requests: Request[]
  updating: string | null
  onClose: () => void
  onUpdateStatus: (id: string, status: StatusKey) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 to-zinc-900">
          <ClientAvatar member={member} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{member.full_name || 'Unnamed Member'}</h2>
            <p className="text-sm text-zinc-500 truncate">{member.email}</p>
            {member.phone && <p className="text-xs text-zinc-700 mt-0.5">{member.phone}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 p-5 border-b border-zinc-800/60">
          {[
            { label: 'Total', value: metrics.totalRequests, color: 'text-white', dot: 'bg-zinc-500' },
            { label: 'Pending', value: metrics.pendingRequests, color: 'text-blue-400', dot: 'bg-blue-500' },
            { label: 'Active', value: metrics.inProgressRequests, color: 'text-amber-400', dot: 'bg-amber-500' },
            { label: 'Done', value: metrics.completedRequests, color: 'text-emerald-400', dot: 'bg-emerald-500' },
          ].map(m => (
            <div key={m.label} className="text-center bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                <span className="text-[10px] text-zinc-600 font-semibold">{m.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Plan status */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 flex-1">
            <Dumbbell size={14} className={metrics.workoutDays > 0 ? 'text-red-400' : 'text-zinc-700'} />
            <span className="text-xs text-zinc-500">Workout:</span>
            <span className={`text-xs font-bold ${metrics.workoutDays > 0 ? 'text-red-400' : 'text-zinc-700'}`}>
              {metrics.workoutDays > 0 ? `${metrics.workoutDays} days` : 'Not assigned'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Salad size={14} className={metrics.dietMeals > 0 ? 'text-emerald-400' : 'text-zinc-700'} />
            <span className="text-xs text-zinc-500">Diet:</span>
            <span className={`text-xs font-bold ${metrics.dietMeals > 0 ? 'text-emerald-400' : 'text-zinc-700'}`}>
              {metrics.dietMeals > 0 ? `${metrics.dietMeals} meals` : 'Not assigned'}
            </span>
          </div>
        </div>

        {/* Request list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
            All Requests ({requests.length})
          </p>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-zinc-700 text-sm">No requests from this member</div>
          ) : (
            requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                status={req.status}
                updating={updating}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </div>

        {/* Quick actions */}
        <div className="p-4 border-t border-zinc-800 grid grid-cols-2 gap-3">
          <a
            href={`/trainer/workout-builder?member=${member.id}`}
            className="py-3 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all text-center flex items-center justify-center gap-2"
          >
            <Dumbbell size={15} /> Build Workout
          </a>
          <a
            href={`/trainer/diet-generator?member=${member.id}`}
            className="py-3 text-sm font-bold bg-emerald-600/15 border border-emerald-600/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all text-center flex items-center justify-center gap-2"
          >
            <Salad size={15} /> Build Diet
          </a>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function TrainerDashboard() {
  const supabase = createClient()

  const [requests, setRequests] = useState<Request[]>([])
  const [metrics, setMetrics] = useState<Map<string, ClientMetrics>>(new Map())
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StatusKey>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [view, setView] = useState<'kanban' | 'roster'>('kanban')
  const [filterType, setFilterType] = useState<'all' | 'diet' | 'workout' | 'both'>('all')

  // ── Load data ──────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: reqData, error: reqErr } = await supabase
        .from('requests')
        .select('id, member_id, status, request_type, notes, created_at, updated_at, member:member_id(id, full_name, email, avatar_url, phone, created_at)')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (reqErr) { toast.error('Failed to load requests'); return }

      const reqs = (reqData as any) || []
      setRequests(reqs)

      const memberIds = [...new Set(reqs.map((r: Request) => r.member_id))] as string[]

      if (memberIds.length > 0) {
        const [{ data: routinesData }, { data: dietData }] = await Promise.all([
          supabase.from('routines').select('member_id, day_label').eq('trainer_id', user.id).in('member_id', memberIds),
          supabase.from('diet_plans').select('member_id, meal_time').eq('trainer_id', user.id).in('member_id', memberIds),
        ])

        const newMap = new Map<string, ClientMetrics>()
        for (const mId of memberIds) {
          const memberReqs = reqs.filter((r: Request) => r.member_id === mId)
          const workoutDays = routinesData
            ? [...new Set(routinesData.filter((r: any) => r.member_id === mId).map((r: any) => r.day_label))].length
            : 0
          const dietMeals = dietData
            ? [...new Set(dietData.filter((d: any) => d.member_id === mId).map((d: any) => d.meal_time))].length
            : 0
          const lastActivity = memberReqs.length > 0 ? (memberReqs[0].updated_at || memberReqs[0].created_at) : null
          newMap.set(mId, {
            memberId: mId,
            totalRequests: memberReqs.length,
            pendingRequests: memberReqs.filter((r: Request) => r.status === 'pending').length,
            inProgressRequests: memberReqs.filter((r: Request) => r.status === 'in_progress').length,
            completedRequests: memberReqs.filter((r: Request) => r.status === 'completed').length,
            workoutDays,
            dietMeals,
            lastActivity,
          })
        }
        setMetrics(newMap)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Update status ──────────────────────────

  async function updateStatus(id: string, status: StatusKey) {
    setUpdating(id)
    const { error } = await supabase
      .from('requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('Failed to update status')
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r))
      toast.success(`Moved to ${STATUS_CONFIG[status].label}`)
    }
    setUpdating(null)
  }

  // ── Derived state ──────────────────────────

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchType = filterType === 'all' || r.request_type === filterType
      const q = searchQuery.toLowerCase()
      const m = r.member as any
      const matchSearch = !q || m?.full_name?.toLowerCase().includes(q) || m?.email?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [requests, filterType, searchQuery])

  const grouped = useMemo(() => ({
    pending: filteredRequests.filter(r => r.status === 'pending'),
    in_progress: filteredRequests.filter(r => r.status === 'in_progress'),
    completed: filteredRequests.filter(r => r.status === 'completed'),
  }), [filteredRequests])

  const uniqueClients = useMemo(() => {
    const seen = new Set<string>()
    return requests.reduce<MemberProfile[]>((acc, req) => {
      if (req.member && !seen.has(req.member_id)) {
        seen.add(req.member_id)
        acc.push(req.member)
      }
      return acc
    }, []).filter(c => {
      const q = searchQuery.toLowerCase()
      return !q || c.full_name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    })
  }, [requests, searchQuery])

  const selectedMember = useMemo(() => selectedMemberId ? uniqueClients.find(c => c.id === selectedMemberId) || null : null, [selectedMemberId, uniqueClients])
  const selectedMemberRequests = useMemo(() => selectedMemberId ? requests.filter(r => r.member_id === selectedMemberId) : [], [selectedMemberId, requests])

  const emptyMetrics = (id: string): ClientMetrics => ({
    memberId: id, totalRequests: 0, pendingRequests: 0, inProgressRequests: 0, completedRequests: 0, workoutDays: 0, dietMeals: 0, lastActivity: null,
  })

  // ── Render ─────────────────────────────────

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold flex items-center gap-2">
            <span className="w-4 h-[2px] bg-red-600 rounded-full" />
            Trainer HQ
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1.5">Client Dashboard</h1>
          <p className="text-zinc-600 text-sm mt-1">Manage your client roster and plan requests</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients', value: uniqueClients.length, icon: Users, bg: 'from-zinc-900 to-zinc-950', border: 'border-zinc-800', color: 'text-white', dot: 'bg-zinc-500', iconBg: 'bg-zinc-800' },
          { label: 'New Requests', value: requests.filter(r => r.status === 'pending').length, icon: Inbox, bg: 'from-blue-950/30 to-zinc-950', border: 'border-blue-900/40', color: 'text-blue-400', dot: 'bg-blue-500', iconBg: 'bg-blue-950/50' },
          { label: 'In Progress', value: requests.filter(r => r.status === 'in_progress').length, icon: TrendingUp, bg: 'from-amber-950/30 to-zinc-950', border: 'border-amber-900/40', color: 'text-amber-400', dot: 'bg-amber-500', iconBg: 'bg-amber-950/50' },
          { label: 'Plans Sent', value: requests.filter(r => r.status === 'completed').length, icon: CheckCircle2, bg: 'from-emerald-950/30 to-zinc-950', border: 'border-emerald-900/40', color: 'text-emerald-400', dot: 'bg-emerald-500', iconBg: 'bg-emerald-950/50' },
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

      {/* View switcher + Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all ${view === 'kanban' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <ClipboardList size={13} /> Request Inbox
          </button>
          <button
            onClick={() => setView('roster')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all ${view === 'roster' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Users size={13} /> Client Roster
          </button>
        </div>

        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search members or notes…"
            className="w-full pl-9 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
              <X size={14} />
            </button>
          )}
        </div>

        {view === 'kanban' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-zinc-700 shrink-0" />
            {(['all', 'workout', 'diet', 'both'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${filterType === type ? 'bg-red-600/20 text-red-400 border-red-700/50' : 'bg-zinc-950 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700'}`}
              >
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          CLIENT ROSTER VIEW
      ═══════════════════════════════════════ */}
      {view === 'roster' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-zinc-800 rounded-lg w-16" />
                  <div className="h-6 bg-zinc-800 rounded-lg w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : uniqueClients.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center">
            <User size={40} className="text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-semibold">No clients yet</p>
            <p className="text-zinc-700 text-sm mt-1">Clients appear here once they send you plan requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueClients.map(member => (
              <ClientRosterCard
                key={member.id}
                member={member}
                metrics={metrics.get(member.id) || emptyMetrics(member.id)}
                requests={requests.filter(r => r.member_id === member.id)}
                onSelect={setSelectedMemberId}
              />
            ))}
          </div>
        )
      )}

      {/* ═══════════════════════════════════════
          KANBAN REQUEST INBOX VIEW
      ═══════════════════════════════════════ */}
      {view === 'kanban' && (
        <>
          {/* Mobile: tab switcher */}
          <div className="lg:hidden">
            <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-4">
              {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(key => {
                const cfg = STATUS_CONFIG[key]
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all ${activeTab === key ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className="truncate">{cfg.shortLabel}</span>
                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'}`}>
                      {grouped[key]?.length || 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
                    <div className="h-4 bg-zinc-900 rounded w-3/4" />
                    <div className="h-3 bg-zinc-900 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : grouped[activeTab]?.length === 0 ? (
              <div className="border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
                <Inbox size={32} className="text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-700 text-sm font-medium">Nothing here yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped[activeTab].map(req => (
                  <RequestCard key={req.id} req={req} status={req.status} updating={updating} onUpdateStatus={updateStatus} />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: 3-column Kanban */}
          <div className="hidden lg:grid grid-cols-3 gap-5">
            {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(key => {
              const cfg = STATUS_CONFIG[key]
              const ColIcon = cfg.icon
              return (
                <div key={key} className="flex flex-col min-h-[400px]">
                  <div className={`flex items-center gap-2.5 mb-4 pb-3 border-b-2 ${cfg.columnBorder}`}>
                    <ColIcon size={16} className={`text-${cfg.color}-400`} />
                    <h2 className="text-sm font-bold text-zinc-300">{cfg.label}</h2>
                    <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                      {grouped[key].length}
                    </span>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 animate-pulse">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-zinc-800 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-4 bg-zinc-900 rounded w-3/4" />
                              <div className="h-3 bg-zinc-900 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="h-8 bg-zinc-900 rounded-xl" />
                            <div className="h-8 bg-zinc-900 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : grouped[key].length === 0 ? (
                    <div className="flex-1 border border-zinc-800/60 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 p-8 text-center">
                      <ColIcon size={28} className="text-zinc-800" />
                      <p className="text-zinc-700 text-sm font-medium">No requests here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {grouped[key].map(req => (
                        <RequestCard key={req.id} req={req} status={key} updating={updating} onUpdateStatus={updateStatus} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Member detail modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          metrics={metrics.get(selectedMember.id) || emptyMetrics(selectedMember.id)}
          requests={selectedMemberRequests}
          updating={updating}
          onClose={() => setSelectedMemberId(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  )
}
