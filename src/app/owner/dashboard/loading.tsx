export default function OwnerDashboardLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-56" />
          <div className="h-3 bg-zinc-800 rounded w-72" />
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-zinc-800 rounded-xl" />
              <div className="w-2 h-2 bg-zinc-800 rounded-full" />
            </div>
            <div className="h-9 bg-zinc-800 rounded w-12" />
            <div className="h-3 bg-zinc-800 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-11 bg-zinc-800 rounded-xl w-36" />
        ))}
      </div>

      {/* Trainers grid */}
      <div className="space-y-3">
        <div className="h-5 bg-zinc-800 rounded w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
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
      </div>

      {/* Recent requests */}
      <div className="space-y-3">
        <div className="h-5 bg-zinc-800 rounded w-40" />
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
    </div>
  )
}
