export default function ExplorLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="h-9 bg-zinc-800 rounded w-44" />
      </div>

      {/* Search bar */}
      <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl" />

      {/* Filter buttons */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-zinc-800 rounded-lg" />)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="h-40 bg-zinc-900" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
