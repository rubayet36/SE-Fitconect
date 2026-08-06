import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch only non-closed days to display on the landing page
  const { data: timetable } = await supabase
    .from('gym_timetable')
    .select('id, day_label, open_time, close_time, is_closed')
    .eq('is_closed', false)
    .order('display_order', { ascending: true })

  const hours: any[] = timetable || []

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Animated background and CSS Grids omitted for brevity (they remain unchanged) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-br from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 z-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-4 text-center pb-12">
        {/* Logo area */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-red-700/20 rounded-full scale-150" />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
              <circle cx="40" cy="40" r="38" stroke="#e11d1d" strokeWidth="2" opacity="0.6" />
              <path d="M40 10 C40 10 60 25 60 40 C60 55 40 70 40 70 C40 70 20 55 20 40 C20 25 40 10 40 10Z" fill="none" stroke="#e11d1d" strokeWidth="1.5" opacity="0.4" />
              <path d="M20 40 Q30 20 40 40 Q50 60 60 40" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="40" cy="40" r="6" fill="#e11d1d" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-wider text-white uppercase">
            VORTEX
          </h1>
          <p className="text-red-500 font-semibold tracking-[0.4em] text-sm uppercase">Fitness Club</p>
        </div>

        <p className="text-zinc-400 max-w-md text-base leading-relaxed">
          The premium platform for gym members and trainers. Track progress, build plans, and train smarter.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/login"
            className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(225,29,29,0.5)] active:scale-95"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex-1 px-8 py-4 bg-transparent border border-zinc-700 hover:border-red-600 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(225,29,29,0.2)] active:scale-95"
          >
            Join Now
          </Link>
        </div>

        {/* Dynamic Gym info strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs tracking-widest uppercase items-center">
          <span className="text-red-500 font-bold">📍 Vortex Fitness Club</span>
          
          {hours.length > 0 ? (
            hours.map(h => (
              <span key={h.id} className="text-zinc-500">
                ⏰ {h.day_label}: {h.open_time} – {h.close_time}
              </span>
            ))
          ) : (
            <span className="text-zinc-500">⏰ Check dashboard for hours</span>
          )}
        </div>
      </div>
    </main>
  )
}
