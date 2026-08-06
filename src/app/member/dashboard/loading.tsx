export default function MemberDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-9 bg-zinc-800 rounded w-40" />
        <div className="h-3 bg-zinc-800 rounded w-32" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="h-7 w-7 bg-zinc-800 rounded" />
            <div className="h-8 bg-zinc-800 rounded w-12" />
            <div className="h-3 bg-zinc-800 rounded w-20" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Billboard skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-40" />
              <div className="h-3 bg-zinc-800 rounded w-full" />
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
          <div className="h-4 bg-zinc-800 rounded w-28 mt-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="h-6 w-6 bg-zinc-800 rounded" />
                <div className="h-4 bg-zinc-800 rounded w-20" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 bg-zinc-800 rounded w-28" />
                <div className="h-4 bg-zinc-800 rounded w-36" />
              </div>
            ))}
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 bg-zinc-800 rounded w-24" />
                  <div className="h-3 bg-zinc-800 rounded w-16" />
                </div>
                <div className="h-6 bg-zinc-800 rounded-full w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
