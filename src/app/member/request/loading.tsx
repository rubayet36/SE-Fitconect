export default function RequestLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="h-9 bg-zinc-800 rounded w-48" />
      </div>

      {/* Progress steps skeleton */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-zinc-800" />
            {s < 3 && <div className="flex-1 h-0.5 bg-zinc-800" />}
          </div>
        ))}
      </div>

      {/* Trainer cards skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-zinc-800 rounded w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 border border-zinc-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-800 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-12 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  )
}
