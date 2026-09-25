'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  User,
  Award,
  Sparkles,
  Clock,
  FileText,
  Phone,
  CheckCircle2,
  ChevronLeft,
  Save,
  Dumbbell,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

const SPECIALTY_PRESETS = [
  'Hypertrophy & Bodybuilding',
  'Fat Loss & Conditioning',
  'Powerlifting & Strength',
  'Functional Training & Mobility',
  'Sports Nutrition & Diet',
  'HIIT & Cardio Endurance',
  'Post-Injury Rehab',
  'Olympic Weightlifting',
]

export default function TrainerProfilePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(3)
  const [certifications, setCertifications] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as any

      if (profile) {
        setFullName(profile.full_name || '')
        setSpecialization(profile.specialization || '')
        setExperienceYears(profile.experience_years ?? 3)
        setCertifications(profile.certifications || '')
        setBio(profile.bio || '')
        setPhone(profile.phone || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  function handleAddPreset(preset: string) {
    if (!specialization.trim()) {
      setSpecialization(preset)
    } else if (!specialization.includes(preset)) {
      setSpecialization(`${specialization}, ${preset}`)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          specialization: specialization.trim() || null,
          experience_years: Number(experienceYears) || 0,
          certifications: certifications.trim() || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Trainer profile updated! Members will now see your specialization.')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/trainer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Trainer HQ
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
          <Award size={14} /> Professional Credentials
        </span>
        <h1 className="text-3xl font-black text-white mt-1">Trainer Profile & Specialties</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Highlight your fitness expertise, coaching philosophy, and certifications. Gym members will see this card when selecting a personal trainer.
        </p>
      </div>

      {loading ? (
        <div className="h-96 rounded-3xl bg-zinc-950 border border-zinc-800 animate-pulse" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Edit Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 space-y-6 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User size={16} className="text-red-500" />
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Email (Account)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 text-sm text-zinc-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Specialization Field */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-red-500" /> Primary Specializations
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">Shown to athletes</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hypertrophy, Strength & Powerlifting, Fat Loss"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />

              {/* Specialty quick select tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-zinc-500 font-semibold block">
                  Quick Add Specializations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="text-[11px] px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience & Certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-red-500" /> Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-sm text-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-red-500" /> Direct Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={13} className="text-red-500" /> Certifications & Accreditations
              </label>
              <input
                type="text"
                placeholder="e.g. CSCS, NASM-CPT, Precision Nutrition L1"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />
            </div>

            {/* Bio / Coaching Philosophy */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-red-500" /> Coaching Philosophy & Bio
              </label>
              <textarea
                rows={4}
                placeholder="Write a short summary about your training style, who you love to coach, and how you help athletes reach their goals."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-sm text-white placeholder-zinc-600 transition-all outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Right Column: Member Preview Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={14} className="text-red-400" /> Member View Preview
              </span>
              <span className="text-[10px] text-green-400 font-mono">Live Card</span>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-red-900/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {(fullName || 'Trainer')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {fullName || 'Coach Name'}
                  </h3>
                  <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Certified Trainer
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {experienceYears} Years Coaching Exp
                  </p>
                </div>
              </div>

              {/* Specialization Tags */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Specialties
                </span>
                {specialization.trim() ? (
                  <div className="flex flex-wrap gap-1.5">
                    {specialization.split(',').map((tag) => (
                      <span
                        key={tag.trim()}
                        className="px-2.5 py-1 rounded-md bg-red-950/40 border border-red-800/40 text-red-300 text-[11px] font-medium"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic">No specialties added yet.</p>
                )}
              </div>

              {/* Certifications preview */}
              {certifications.trim() && (
                <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Accreditations
                  </span>
                  <p className="text-xs text-zinc-300 font-medium">{certifications}</p>
                </div>
              )}

              {/* Bio preview */}
              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  About Coach
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  &quot;{bio.trim() || 'Ready to help you crush your gym and nutrition goals.'}&quot;
                </p>
              </div>

              <div className="pt-2">
                <div className="w-full py-2.5 bg-red-600/20 text-red-400 rounded-xl text-center text-xs font-bold uppercase tracking-wider border border-red-800/30">
                  Select This Coach
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
