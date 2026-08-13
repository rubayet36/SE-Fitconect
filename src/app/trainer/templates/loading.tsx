export default function TemplatesLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-44" />
        </div>
        <div className="w-36 h-10 bg-zinc-800 rounded-lg" />
      </div>

      {/* Template cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="h-5 bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-zinc-800 rounded w-full" />
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-zinc-800 rounded-lg flex-1" />
              <div className="h-8 bg-zinc-800 rounded-lg w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
