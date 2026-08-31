export default function OwnerTimetableLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-9 bg-zinc-800 rounded w-56" />
          <div className="h-3 bg-zinc-800 rounded w-72" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
          <div className="w-36 h-10 bg-zinc-800 rounded-lg" />
        </div>
      </div>


    </div>
  )
}
