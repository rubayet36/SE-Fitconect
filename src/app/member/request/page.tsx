'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Send, ChevronDown } from 'lucide-react'

interface Trainer { id: string; full_name: string | null; email: string }

export default function RequestPage() {
  const supabase = createClient()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [trainerId, setTrainerId] = useState('')
  const [requestType, setRequestType] = useState<'diet' | 'workout' | 'both'>('both')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email').eq('role', 'trainer').then(({ data }) => {
      setTrainers(data || [])
    })
  }, [supabase])

  async function handleSubmit() {
    if (!trainerId) { toast.error('Please select a trainer'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('requests').insert({
      member_id: user.id,
      trainer_id: trainerId,
      request_type: requestType,
      notes: notes || null,
    })
    if (error) {
      toast.error('Failed to submit request. ' + error.message)
    } else {
      setSubmitted(true)
      toast.success('Request submitted successfully!')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="text-8xl">🎉</div>
        <h1 className="text-3xl font-black text-white">Request Sent!</h1>
        <p className="text-zinc-500">Your trainer has been notified and will prepare your plan shortly. Check back on the dashboard for updates.</p>
        <a href="/member/dashboard"
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all hover:shadow-[0_0_20px_rgba(225,29,29,0.4)]">
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-8">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Get Started</p>
        <h1 className="text-3xl font-black text-white mt-1">Request a Plan</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
              step >= s ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-600'
            }`}>{s}</div>
            {s < 3 && <div className={`flex-1 h-0.5 transition-all duration-500 ${step > s ? 'bg-red-600' : 'bg-zinc-800'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Trainer */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Choose Your Trainer</h2>
          <div className="space-y-3">
            {trainers.length === 0 ? (
              <p className="text-zinc-500 text-sm">No trainers available yet.</p>
            ) : trainers.map(trainer => (
              <button key={trainer.id} onClick={() => setTrainerId(trainer.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  trainerId === trainer.id
                    ? 'border-red-500 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                }`}>
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-black text-sm">
                  {(trainer.full_name || trainer.email)[0].toUpperCase()}
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold text-sm transition-colors ${trainerId === trainer.id ? 'text-red-400' : 'text-white'}`}>{trainer.full_name || 'Trainer'}</p>
                  <p className="text-xs text-zinc-500">{trainer.email}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                  trainerId === trainer.id
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-zinc-700'
                }`}>
                  {trainerId === trainer.id && <span className="text-xs font-black">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => trainerId && setStep(2)} disabled={!trainerId}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold uppercase tracking-widest text-sm rounded-lg transition-all">
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Request Type */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">What do you need?</h2>
          <div className="grid gap-3">
            {([
              { value: 'workout', label: '💪 Workout Plan', desc: 'A custom day-by-day training routine' },
              { value: 'diet', label: '🥗 Diet Chart', desc: 'A nutrition plan based on your goals' },
              { value: 'both', label: '⚡ Both Plans', desc: 'Complete workout + diet package' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setRequestType(opt.value)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  requestType === opt.value
                    ? 'border-red-500 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'
                }`}>
                {/* Selected badge */}
                {requestType === opt.value && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-black">✓</span>
                  </span>
                )}
                <div className={`font-bold text-sm transition-colors ${requestType === opt.value ? 'text-red-400' : 'text-white'}`}>{opt.label}</div>
                <div className="text-xs text-zinc-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-sm font-bold rounded-lg transition-all">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm rounded-lg transition-all">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Notes */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Any special notes?</h2>
          <p className="text-zinc-500 text-sm">Tell your trainer about your goals, fitness level, injuries, or preferences.</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Goal: lose 10kg. I have a knee injury. Prefer morning workouts. Vegetarian diet..."
            rows={5}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors resize-none text-sm leading-relaxed"
          />
          <div className="bg-zinc-900 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Trainer</span>
              <span className="text-white font-semibold">{trainers.find(t => t.id === trainerId)?.full_name || 'Selected Trainer'}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Request Type</span>
              <span className="text-white font-semibold capitalize">{requestType}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-sm font-bold rounded-lg transition-all">Back</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold uppercase tracking-widest text-sm rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Submit</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
