import { createClient } from '@/lib/supabase/server'
import { ExerciseDetailModal } from '../../../components/ExerciseDetailModal'

export default async function MyPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: routines } = await supabase
    .from('routines')
    .select('*')
    .eq('member_id', user!.id)
    .order('day_label')
    .order('order_index') as any

  const dayMap: { [key: string]: typeof routines } = {}
  for (const r of routines || []) {
    if (!dayMap[r.day_label]) dayMap[r.day_label] = []
    dayMap[r.day_label]!.push(r)
  }
  const days = Object.keys(dayMap)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Your Training</p>
        <h1 className="text-3xl font-black text-white mt-1">My Workout Plan</h1>
      </div>

      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="text-xl font-bold text-white mb-2">No Workout Plan Yet</h2>
          <p className="text-zinc-500 text-sm max-w-sm">Request a workout plan from a trainer to get started on your fitness journey.</p>
          <a href="/member/request"
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(225,29,29,0.4)]">
            Request a Plan
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(day => (
            <div key={day} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-red-950/30 to-transparent border-b border-zinc-800 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="font-black text-white tracking-wide">{day}</h2>
                <span className="ml-auto text-xs text-zinc-600">{dayMap[day]?.length} exercises</span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {dayMap[day]?.map((exercise: any, idx: number) => (
                  <ExerciseDetailModal key={exercise.id} exercise={exercise} index={idx} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
