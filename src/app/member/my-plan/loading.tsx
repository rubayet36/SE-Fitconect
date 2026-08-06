export default function MyPlanLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-9 bg-zinc-800 rounded w-48" />
      </div>

      {/* Day cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="h-5 bg-zinc-800 rounded w-28" />
            <div className="ml-auto h-4 bg-zinc-800 rounded w-16" />
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="px-6 py-4 flex items-center gap-4">
                <div className="h-4 bg-zinc-800 rounded w-6" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-36" />
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                </div>
                <div className="h-8 bg-zinc-800 rounded-lg w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
