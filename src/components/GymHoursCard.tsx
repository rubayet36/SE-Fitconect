'use client'

import { Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface GymHourRow {
  id: string
  day_label: string
  open_time: string
  close_time: string
  is_closed: boolean
}

/**
 * GymHoursCard — A reusable, self-fetching gym operating hours widget.
 *
 * Uses TanStack Query v5 to fetch timetable data from Supabase.
 * Intended for embedding in member, trainer, and owner dashboards.
 *
 * If `initialData` is passed (e.g., from a Server Component), it
 * will use that as the initial cache seed and still refetch in the
 * background when the data becomes stale.
 */
export function GymHoursCard({ initialData }: { initialData?: GymHourRow[] }) {
  const supabase = createClient()

  const { data: gymHours = [], isLoading } = useQuery({
    queryKey: ['gym_timetable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_timetable')
        .select('id, day_label, open_time, close_time, is_closed')
        .order('display_order', { ascending: true })

      if (error) throw error
      return (data as GymHourRow[]) || []
    },
    initialData,
  })

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 mb-4">
        <span className="w-4 h-[2px] bg-red-600" /> Gym Hours
        <Clock size={13} className="text-zinc-600 ml-auto" />
      </h2>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-3 bg-zinc-800 rounded w-24" />
              <div className="h-4 bg-zinc-800 rounded w-36" />
            </div>
          ))}
        </div>
      ) : gymHours.length > 0 ? (
        <div className="space-y-3">
          {gymHours.map(h => (
            <div key={h.id} className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-500">{h.day_label}</span>
              <span className="text-sm font-semibold text-white">
                {h.is_closed ? '🔒 Closed' : `${h.open_time} – ${h.close_time}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">Hours not available</p>
      )}
    </div>
  )
}
