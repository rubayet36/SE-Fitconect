export default function OwnerBillboardLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-52" />
          <div className="h-3 bg-zinc-800 rounded w-64" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* Post form skeleton */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-32" />
        <div className="h-10 bg-zinc-800 rounded-lg w-full" />
        <div className="h-24 bg-zinc-800 rounded-lg w-full" />
        <div className="flex gap-3">
          <div className="h-8 bg-zinc-800 rounded-lg w-20" />
          <div className="h-8 bg-zinc-800 rounded-lg w-20" />
          <div className="h-8 bg-zinc-800 rounded-lg w-20" />
        </div>
        <div className="h-11 bg-zinc-800 rounded-lg w-36" />
      </div>

      {/* Notice cards */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-zinc-800 rounded w-full" />
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-800 rounded w-1/3 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
