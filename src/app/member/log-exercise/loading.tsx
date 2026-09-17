export default function Loading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-zinc-900 rounded-lg" />
      <div className="h-4 w-96 bg-zinc-900/60 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-32 bg-zinc-950 border border-zinc-800 rounded-2xl" />
          <div className="h-48 bg-zinc-950 border border-zinc-800 rounded-2xl" />
          <div className="h-40 bg-zinc-950 border border-zinc-800 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl" />
          <div className="h-48 bg-zinc-950 border border-zinc-800 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
