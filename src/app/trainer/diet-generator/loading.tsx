export default function DietGeneratorLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-9 bg-zinc-800 rounded w-52" />
        <div className="h-3 bg-zinc-800 rounded w-72" />
      </div>

      {/* Member selector */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>

      {/* Macros + options grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-28" />
            <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="h-12 bg-zinc-800 rounded-lg" />

      {/* Preview area */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden space-y-0">
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="h-5 bg-zinc-800 rounded w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-4 bg-zinc-800 rounded w-32" />
              <div className="h-3 bg-zinc-800 rounded w-48" />
            </div>
            <div className="h-5 bg-zinc-800 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
