export default function TrainerDashboardLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-48" />
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="h-9 bg-zinc-800 rounded w-10" />
            <div className="h-3 bg-zinc-800 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map(col => (
          <div key={col} className="space-y-3 min-w-[280px] flex-1">
            <div className="h-5 bg-zinc-800 rounded w-28" />
            {[1, 2].map(i => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="h-8 bg-zinc-800 rounded-lg" />
                  <div className="h-8 bg-zinc-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
