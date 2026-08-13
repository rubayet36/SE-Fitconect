'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'

export default function OwnerCreateTrainerPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/create-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create trainer account')
        setLoading(false)
        return
      }

      toast.success('Trainer account created successfully!')
      setTimeout(() => {
        router.push('/owner/dashboard')
        router.refresh()
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/owner/dashboard" className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Owner Panel</p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">Create Trainer</h1>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 lg:p-8">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Full Name</label>
            <input
              type="text" required value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Trainer"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Phone (optional)</label>
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+880 1234 567890"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-widest uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 mt-4 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold tracking-widest text-sm uppercase rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] active:scale-[0.99] flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><UserPlus size={16} /> Create Trainer Account</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
