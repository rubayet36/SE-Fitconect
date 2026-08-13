'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string | null
  exercises: any[]
  created_at: string
}

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadTemplates = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('routine_templates').select('*').eq('trainer_id', user.id).order('created_at', { ascending: false })
    setTemplates((data as Template[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => { await loadTemplates() }
    init()
  }, [loadTemplates])

  async function createTemplate() {
    if (!newName.trim()) { toast.error('Give the template a name'); return }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('routine_templates').insert({
      trainer_id: user.id,
      name: newName,
      description: newDesc || null,
      exercises: [],
    }).select().single()
    if (error) toast.error('Failed: ' + error.message)
    else {
      setTemplates(prev => [data, ...prev])
      setNewName('')
      setNewDesc('')
      toast.success('Template created!')
    }
    setCreating(false)
  }

  async function deleteTemplate(id: string) {
    await supabase.from('routine_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Template deleted')
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Trainer Tools</p>
        <h1 className="text-3xl font-black text-white mt-1">Routine Templates</h1>
        <p className="text-zinc-500 text-sm mt-1">Save your best plans as reusable templates.</p>
      </div>

      {/* Create Template */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Create New Template</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Template Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="e.g. 4-Day Push Pull Legs"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-600 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Description (optional)</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Who is this for?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-600 transition-colors" />
          </div>
        </div>
        <button onClick={createTemplate} disabled={creating || !newName}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold text-sm rounded-lg transition-all">
          {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create Template</>}
        </button>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-950 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-lg font-bold text-white mb-2">No Templates Yet</h2>
          <p className="text-zinc-500 text-sm">Create your first template above to speed up plan creation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(template => (
            <div key={template.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm">{template.name}</h3>
                  {template.description && <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-700">{new Date(template.created_at).toLocaleDateString()}</span>
                  <button onClick={() => setExpanded(expanded === template.id ? null : template.id)}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    {expanded === template.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {expanded === template.id && (
                <div className="border-t border-zinc-800 px-5 py-4">
                  {template.exercises?.length > 0 ? (
                    <div className="space-y-2">
                      {template.exercises.map((ex: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-red-500 font-bold w-5 shrink-0">{i + 1}.</span>
                          <span className="text-white capitalize flex-1">{ex.name}</span>
                          <span className="text-zinc-600">{ex.sets}×{ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-zinc-600 text-sm">This template has no exercises yet.</p>
                      <a href="/trainer/workout-builder"
                        className="text-red-500 text-xs hover:text-red-400 mt-1 block">Build plan in Workout Builder →</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
