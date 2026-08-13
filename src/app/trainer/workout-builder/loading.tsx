export default function WorkoutBuilderLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-56" />
        </div>
        <div className="w-36 h-10 bg-zinc-800 rounded-lg" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Exercise search panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout plan panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-5 bg-zinc-800 rounded w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-48" />
              <div className="h-3 bg-zinc-800 rounded w-32" />
              <div className="flex gap-2 pt-1">
                <div className="h-7 bg-zinc-800 rounded w-20" />
                <div className="h-7 bg-zinc-800 rounded w-20" />
              </div>
            </div>
          ))}
          <div className="h-12 bg-zinc-800 rounded-lg mt-4" />
        </div>
      </div>
    </div>
  )
}
