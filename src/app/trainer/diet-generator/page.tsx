'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Zap, Save, Plus, Trash2 } from 'lucide-react'

interface MealRow { meal_time: string; food_items: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; notes: string }
interface Member { id: string; full_name: string | null; email: string }

const MEAL_TEMPLATES: MealRow[] = [
  { meal_time: 'Early Morning (6:00 AM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
  { meal_time: 'Breakfast (8:00 AM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
  { meal_time: 'Mid-Morning Snack (10:30 AM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
  { meal_time: 'Lunch (1:00 PM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
  { meal_time: 'Afternoon Snack (4:00 PM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
  { meal_time: 'Dinner (8:00 PM)', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' },
]

function generateBaseline(goal: string, weight: number, activityLevel: string): MealRow[] {
  const bmrMultiplier = activityLevel === 'sedentary' ? 1.2 : activityLevel === 'moderate' ? 1.55 : 1.9
  const baseCalories = Math.round(weight * 25 * bmrMultiplier)
  const goalCalories = goal === 'weight_loss' ? Math.round(baseCalories * 0.8) :
    goal === 'bulking' ? Math.round(baseCalories * 1.15) : baseCalories
  
  const proteinG = goal === 'bulking' ? Math.round(weight * 2) : Math.round(weight * 1.6)
  const fatG = Math.round(goalCalories * 0.25 / 9)
  const carbsG = Math.round((goalCalories - proteinG * 4 - fatG * 9) / 4)

  const distribution = [0.05, 0.25, 0.1, 0.3, 0.1, 0.2]
  return MEAL_TEMPLATES.map((template, i) => ({
    ...template,
    calories: Math.round(goalCalories * distribution[i]),
    protein_g: Math.round(proteinG * distribution[i]),
    carbs_g: Math.round(carbsG * distribution[i]),
    fat_g: Math.round(fatG * distribution[i]),
    food_items: getSampleFoods(template.meal_time, goal),
  }))
}

function getSampleFoods(mealTime: string, goal: string): string {
  if (mealTime.includes('Early')) return 'Water 500ml, Soaked Almonds (5-6), Black Coffee/Green Tea'
  if (mealTime.includes('Breakfast')) return goal === 'bulking'
    ? 'Oats 100g, Banana, 4 Egg Whites + 1 Whole Egg, Whole Milk 200ml'
    : '4 Egg Whites Scrambled, 2 Whole Wheat Toast, Avocado half, Black Coffee'
  if (mealTime.includes('Mid')) return 'Low-fat Yogurt 150g, Apple, Mixed Nuts 20g'
  if (mealTime.includes('Lunch')) return goal === 'bulking'
    ? 'Brown Rice 150g, Chicken Breast 180g, Mixed Vegetables, Olive Oil 1 tbsp'
    : 'Grilled Chicken 150g, Salad (Lettuce, Tomato, Cucumber), Lemon Dressing'
  if (mealTime.includes('Afternoon')) return 'Protein Shake 30g, Banana'
  if (mealTime.includes('Dinner')) return goal === 'weight_loss'
    ? 'Grilled Fish 150g, Steamed Broccoli, Sweet Potato small'
    : 'Lean Beef 150g, Brown Rice 100g, Stir-fried Vegetables'
  return 'Balanced meal'
}

export default function DietGeneratorPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [memberId, setMemberId] = useState('')
  const [goal, setGoal] = useState('maintenance')
  const [weight, setWeight] = useState(70)
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [meals, setMeals] = useState<MealRow[]>(MEAL_TEMPLATES.map(t => ({ ...t })))
  const [generated, setGenerated] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadActiveMembers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: activeRequests } = await supabase
        .from('requests')
        .select('member_id')
        .eq('trainer_id', user.id)
        .in('request_type', ['diet', 'both'])
        .in('status', ['pending', 'in_progress'])

      if (activeRequests && activeRequests.length > 0) {
        const memberIds = [...new Set(activeRequests.map(r => r.member_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', memberIds)
        setMembers(profiles || [])
      } else {
        setMembers([])
      }
    }
    loadActiveMembers()
  }, [supabase])

  function handleGenerate() {
    if (!memberId) { toast.error('Select a member first'); return }
    const baseline = generateBaseline(goal, weight, activityLevel)
    setMeals(baseline)
    setGenerated(true)
    toast.success('Baseline diet chart generated! Adjust as needed.')
  }

  function updateMeal(idx: number, field: keyof MealRow, value: string | number) {
    setMeals(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  function addMeal() {
    setMeals(prev => [...prev, { meal_time: 'Custom Meal', food_items: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' }])
  }

  function removeMeal(idx: number) {
    setMeals(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveDiet() {
    if (!memberId) { toast.error('Select a member'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('diet_plans').delete().eq('member_id', memberId).eq('trainer_id', user.id)
    const rows = meals.filter(m => m.food_items).map(m => ({
      member_id: memberId,
      trainer_id: user.id,
      meal_time: m.meal_time,
      food_items: m.food_items,
      calories: m.calories || null,
      protein_g: m.protein_g || null,
      carbs_g: m.carbs_g || null,
      fat_g: m.fat_g || null,
      notes: m.notes || null,
    }))

    const { error } = await supabase.from('diet_plans').insert(rows)
    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success('Diet chart saved and sent to member!')

      // ── Email the member ───────────────────────────────
      try {
        const [memberRes, trainerRes] = await Promise.all([
          supabase.from('profiles').select('email, full_name').eq('id', memberId).single(),
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        ])
        const memberEmail = (memberRes.data as any)?.email
        const memberName = (memberRes.data as any)?.full_name || 'Athlete'
        const trainerName = (trainerRes.data as any)?.full_name || 'Your Trainer'
        const totalCalories = rows.reduce((sum: number, r: any) => sum + (r.calories || 0), 0)
        
        if (memberEmail) {
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'diet',
              to: [memberEmail],
              payload: {
                memberName,
                trainerName,
                mealCount: rows.length,
                totalCalories,
              },
            }),
          })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              toast.success(`📧 Diet chart emailed to ${memberName}`)
            } else {
              toast.error(`Email failed: ${data.error || 'Unknown error'}`)
            }
          })
          .catch(() => toast.warning('Diet saved but notification server was unreachable'))
        } else {
          toast.warning(`Notification skipped: No email found for ${memberName}`)
        }
      } catch (dbErr) {
        console.error('[diet-generator] Fetch error:', dbErr)
        toast.error('Diet saved but could not fetch member email for notification')
      }
    }
    setSaving(false)
  }

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein_g || 0),
    carbs: acc.carbs + (m.carbs_g || 0),
    fat: acc.fat + (m.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Trainer Tools</p>
        <h1 className="text-3xl font-black text-white mt-1">Diet Chart Generator</h1>
      </div>

      {/* Config */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Auto-Generate Baseline</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Member</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors">
              <option value="">Select Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors">
              <option value="weight_loss">Weight Loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="bulking">Bulking</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Body Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={40} max={200}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Activity Level</label>
            <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors">
              <option value="sedentary">Sedentary</option>
              <option value="moderate">Moderate</option>
              <option value="active">Very Active</option>
            </select>
          </div>
        </div>
        <button onClick={handleGenerate}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 hover:border-red-600 hover:bg-red-950/20 text-white font-bold text-sm rounded-lg transition-all">
          <Zap size={16} className="text-red-400" /> Generate Baseline Diet
        </button>
      </div>

      {/* Macro totals */}
      {generated && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Calories', val: `${totals.calories} kcal`, color: 'red' },
            { label: 'Protein', val: `${totals.protein}g`, color: 'blue' },
            { label: 'Carbs', val: `${totals.carbs}g`, color: 'green' },
            { label: 'Fats', val: `${totals.fat}g`, color: 'yellow' },
          ].map(m => (
            <div key={m.label} className={`p-4 rounded-xl border text-center ${
              m.color === 'red' ? 'bg-red-950/20 border-red-800/30' :
              m.color === 'blue' ? 'bg-blue-950/20 border-blue-800/30' :
              m.color === 'green' ? 'bg-green-950/20 border-green-800/30' :
              'bg-yellow-950/20 border-yellow-800/30'
            }`}>
              <div className={`text-lg font-black ${
                m.color === 'red' ? 'text-red-400' : m.color === 'blue' ? 'text-blue-400' :
                m.color === 'green' ? 'text-green-400' : 'text-yellow-400'
              }`}>{m.val}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Meal editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-sm">Meal Plan</h2>
          <button onClick={addMeal} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-lg text-xs font-bold transition-all">
            <Plus size={12} /> Add Meal
          </button>
        </div>
        {meals.map((meal, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <input value={meal.meal_time} onChange={e => updateMeal(i, 'meal_time', e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-sm focus:outline-none border-b border-transparent hover:border-zinc-700 focus:border-red-600 pb-0.5 transition-colors" />
              <button onClick={() => removeMeal(i)} className="text-zinc-700 hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
            <textarea value={meal.food_items} onChange={e => updateMeal(i, 'food_items', e.target.value)}
              placeholder="Food items (e.g. Oats 100g, Banana, Protein Shake 30g...)"
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:border-red-600 resize-none transition-colors" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map(field => (
                <div key={field}>
                  <label className="text-[10px] text-zinc-600 uppercase tracking-widest">{field.replace('_g', '').replace('calories', 'kcal')}</label>
                  <input type="number" min={0} value={(meal as any)[field]}
                    onChange={e => updateMeal(i, field, Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-red-600 transition-colors mt-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={saveDiet} disabled={saving}
        className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all hover:shadow-[0_0_25px_rgba(225,29,29,0.4)] flex items-center justify-center gap-2">
        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save & Send Diet Chart</>}
      </button>
    </div>
  )
}
