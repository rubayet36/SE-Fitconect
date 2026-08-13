import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Dumbbell, ClipboardList, Crown, UserPlus, Megaphone, Clock } from 'lucide-react'
import { UserList } from './UserList'

export default async function OwnerDashboard() {
  const supabase = await createClient()

  const [trainersRes, membersRes, requestsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').eq('role', 'trainer').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email, created_at, user_id_code').eq('role', 'member').order('created_at', { ascending: false }),
    supabase.from('requests').select('id, status, request_type, created_at, member:member_id(full_name, email)').order('created_at', { ascending: false }),
  ])

  const trainers: any[] = trainersRes.data || []
  const members: any[] = membersRes.data || []
  const requests: any[] = requestsRes.data || []
  const pendingRequests = requests.filter(r => r.status === 'pending')

  const stats = [
    { label: 'Total Trainers', value: trainers.length, icon: Dumbbell, color: 'red' },
    { label: 'Total Members', value: members.length, icon: Users, color: 'blue' },
    { label: 'Pending Requests', value: pendingRequests.length, icon: ClipboardList, color: 'yellow' },
    { label: 'All Time Requests', value: requests.length, icon: ClipboardList, color: 'green' },
  ]

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs tracking-widest uppercase font-semibold">
            <Crown size={14} /> Owner Portal
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/owner/create-trainer"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all">
            <UserPlus size={14} /> Add Trainer
          </Link>
          <Link href="/owner/billboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-red-700 text-zinc-300 hover:text-red-400 text-xs font-bold rounded-lg transition-all">
            <Megaphone size={14} /> Billboard
          </Link>
          <Link href="/owner/timetable"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-red-700 text-zinc-300 hover:text-red-400 text-xs font-bold rounded-lg transition-all">
            <Clock size={14} /> Timetable
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                stat.color === 'red' ? 'bg-red-600/20 text-red-400' :
                stat.color === 'blue' ? 'bg-blue-600/20 text-blue-400' :
                stat.color === 'yellow' ? 'bg-yellow-600/20 text-yellow-400' :
                'bg-green-600/20 text-green-400'
              }`}>
                <Icon size={16} />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 font-semibold mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trainers List */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[2px] bg-red-600" /> All Trainers
            </h2>
            <Link href="/owner/create-trainer" className="text-[10px] text-red-400 hover:text-red-300 font-bold tracking-widest uppercase">
              + Add
            </Link>
          </div>
          <UserList users={trainers} type="trainer" />
        </div>

        {/* Members List */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[2px] bg-blue-500" /> All Members
              <span className="ml-auto text-[10px] font-semibold bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">{members.length}</span>
            </h2>
          </div>
          <UserList users={members} type="member" />
        </div>
      </div>

      {/* Plan Requests Overview */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 mb-4">
          <span className="w-4 h-[2px] bg-yellow-500" /> Member Plan Requests
          {pendingRequests.length > 0 && (
            <span className="ml-auto text-[10px] font-semibold bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {pendingRequests.length} pending
            </span>
          )}
        </h2>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">No plan requests yet</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto">
            {requests.slice(0, 30).map(req => (
              <div key={req.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                req.status === 'pending' ? 'bg-yellow-950/20 border-yellow-900/30' :
                req.status === 'in_progress' ? 'bg-blue-950/20 border-blue-900/30' :
                'bg-green-950/20 border-green-900/30'
              }`}>
                <div>
                  <p className="text-xs font-bold text-white">{(req.member as any)?.full_name || (req.member as any)?.email || 'Member'}</p>
                  <p className="text-[10px] text-zinc-500 capitalize">{req.request_type} plan</p>
                </div>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                  req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  req.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>{req.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
