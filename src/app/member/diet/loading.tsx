export default function DietLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="h-9 bg-zinc-800 rounded w-40" />
      </div>

      {/* Macro cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="h-7 bg-zinc-800 rounded w-20" />
            <div className="h-3 bg-zinc-800 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Meal table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="h-5 bg-zinc-800 rounded w-32" />
        </div>
        <div className="divide-y divide-zinc-800/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-36" />
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <div className="h-5 bg-zinc-800 rounded w-10" />
                <div className="h-3 bg-zinc-800 rounded w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
