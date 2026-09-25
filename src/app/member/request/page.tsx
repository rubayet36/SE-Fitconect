'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Send, Award, Clock, Sparkles, Check, ChevronLeft, ArrowRight, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Trainer {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  specialization: string | null
  bio: string | null
  experience_years: number | null
  certifications: string | null
}

function RequestFormContent() {
  const searchParams = useSearchParams()
  const initialTrainerId = searchParams.get('trainerId') || ''

  const supabase = createClient()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [trainerId, setTrainerId] = useState(initialTrainerId)
  const [requestType, setRequestType] = useState<'diet' | 'workout' | 'both'>('both')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTrainers, setLoadingTrainers] = useState(true)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function loadTrainers() {
      setLoadingTrainers(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, specialization, bio, experience_years, certifications')
        .eq('role', 'trainer')

      const trainerList = (data as Trainer[]) || []
      setTrainers(trainerList)

      if (initialTrainerId && trainerList.some(t => t.id === initialTrainerId)) {
        setTrainerId(initialTrainerId)
      }

      setLoadingTrainers(false)
    }

    loadTrainers()
  }, [supabase, initialTrainerId])

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
      toast.error('Failed to submit request: ' + error.message)
    } else {
      setSubmitted(true)
      toast.success('Request submitted successfully!')
    }
    setLoading(false)
  }

  const selectedTrainer = trainers.find(t => t.id === trainerId)

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="text-8xl">🎉</div>
        <h1 className="text-3xl font-black text-white">Request Sent!</h1>
        <p className="text-zinc-400 text-sm max-w-md">
          Your chosen trainer <strong className="text-white">{selectedTrainer?.full_name || 'Coach'}</strong> has received your plan request and will prepare your tailored program.
        </p>
        <Link
          href="/member/dashboard"
          className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,29,0.35)] text-xs uppercase tracking-widest"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/member/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Step {step} of 3</p>
        <h1 className="text-3xl font-black text-white mt-1">Request a Custom Plan</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Select a specialist trainer based on their expertise and submit your fitness goals.
        </p>
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

      {/* Step 1: Choose Trainer (with Specialization Info) */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-base">Choose Your Trainer</h2>
            <span className="text-xs text-zinc-500">{trainers.length} Certified Coaches</span>
          </div>

          <div className="space-y-3">
            {loadingTrainers ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : trainers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
                <p className="text-zinc-500 text-sm">No trainers available right now.</p>
              </div>
            ) : trainers.map(trainer => {
              const isSelected = trainerId === trainer.id
              const specialties = trainer.specialization
                ? trainer.specialization.split(',').map(s => s.trim()).filter(Boolean)
                : []

              return (
                <button
                  key={trainer.id}
                  type="button"
                  onClick={() => setTrainerId(trainer.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-red-500 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                      : 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg">
                      {(trainer.full_name || trainer.email)[0].toUpperCase()}
                    </div>

                    {/* Main Trainer Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className={`font-black text-base transition-colors ${isSelected ? 'text-red-400' : 'text-white'}`}>
                            {trainer.full_name || 'Coach'}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">{trainer.email}</p>
                        </div>

                        {/* Checkbox indicator */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-zinc-700'
                        }`}>
                          {isSelected && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>

                      {/* Specialization Tags */}
                      {specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {specialties.map((spec) => (
                            <span
                              key={spec}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                isSelected
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                              }`}
                            >
                              🔥 {spec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">General Fitness & Strength Coach</p>
                      )}

                      {/* Experience & Certifications */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                        {trainer.experience_years ? (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                            <Clock size={12} className="text-red-400" />
                            {trainer.experience_years}+ Yrs Exp
                          </span>
                        ) : null}

                        {trainer.certifications && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400 truncate max-w-xs">
                            <Award size={12} className="text-yellow-500 shrink-0" />
                            {trainer.certifications}
                          </span>
                        )}
                      </div>

                      {/* Bio snippet */}
                      {trainer.bio && (
                        <p className="text-xs text-zinc-400 leading-relaxed italic pt-1 border-t border-zinc-900/60 line-clamp-2">
                          &quot;{trainer.bio}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => trainerId && setStep(2)}
            disabled={!trainerId}
            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue to Plan Selection <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Step 2: Request Type */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-400">Selected Coach:</span>
            <span className="font-bold text-white">{selectedTrainer?.full_name || 'Coach'}</span>
          </div>

          <h2 className="font-bold text-white text-base">What do you need?</h2>
          <div className="grid gap-3">
            {([
              { value: 'workout', label: '💪 Workout Routine', desc: 'Custom day-by-day workout splits tailored to your goals' },
              { value: 'diet', label: '🥗 Nutrition & Diet Chart', desc: 'Daily meal schedule, macros, and calorie breakdown' },
              { value: 'both', label: '⚡ Complete Package (Workout + Diet)', desc: 'Full transformation plan including training routines and daily meals' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setRequestType(opt.value)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  requestType === opt.value
                    ? 'border-red-500 bg-red-950/25 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                {requestType === opt.value && (
                  <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <Check size={12} className="text-white stroke-[3]" />
                  </span>
                )}
                <div className={`font-bold text-sm ${requestType === opt.value ? 'text-red-400' : 'text-white'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-zinc-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-zinc-800 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Next: Add Details <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Notes & Goals */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Coach:</span>
              <span className="font-bold text-white">{selectedTrainer?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Plan Type:</span>
              <span className="font-bold text-red-400 capitalize">{requestType}</span>
            </div>
          </div>

          <h2 className="font-bold text-white text-base">Tell your coach about your goals</h2>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
              Injuries, preferences, or target timeline
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="e.g. Looking to build upper body strength, workout 4 days a week, no dairy in diet, slight left shoulder pain..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-red-500 focus:outline-none placeholder-zinc-700 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-zinc-800 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              {loading ? 'Submitting Request...' : 'Send Request to Coach'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] p-8" />}>
      <RequestFormContent />
    </Suspense>
  )
}
