import { createClient } from '@/lib/supabase/server'

export default async function DietPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dietPlans } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('member_id', user!.id)
    .order('meal_time') as any

  const MEAL_ORDER = ['Early Morning', 'Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Pre-Workout', 'Post-Workout', 'Dinner', 'Bedtime Snack']
  const sorted = dietPlans?.sort((a: any, b: any) => {
    const ai = MEAL_ORDER.findIndex(m => a.meal_time.includes(m) || m.includes(a.meal_time))
    const bi = MEAL_ORDER.findIndex(m => b.meal_time.includes(m) || m.includes(b.meal_time))
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const totals = dietPlans?.reduce((acc: any, d: any) => ({
    calories: acc.calories + (d.calories || 0),
    protein: acc.protein + (d.protein_g || 0),
    carbs: acc.carbs + (d.carbs_g || 0),
    fat: acc.fat + (d.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-semibold">Nutrition</p>
        <h1 className="text-3xl font-black text-white mt-1">My Diet Chart</h1>
      </div>

      {!dietPlans || dietPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🥗</div>
          <h2 className="text-xl font-bold text-white mb-2">No Diet Plan Yet</h2>
          <p className="text-zinc-500 text-sm max-w-sm">Your trainer will assign a diet plan tailored to your goals.</p>
          <a href="/member/request"
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(225,29,29,0.4)]">
            Request a Plan
          </a>
        </div>
      ) : (
        <>
          {/* Macro Summary */}
          {totals && totals.calories > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Calories', value: `${totals.calories} kcal`, color: 'red' },
                { label: 'Protein', value: `${totals.protein}g`, color: 'blue' },
                { label: 'Carbs', value: `${totals.carbs}g`, color: 'green' },
                { label: 'Fats', value: `${totals.fat}g`, color: 'yellow' },
              ].map(macro => (
                <div key={macro.label} className={`p-4 rounded-xl border ${
                  macro.color === 'red' ? 'bg-red-950/20 border-red-800/30' :
                  macro.color === 'blue' ? 'bg-blue-950/20 border-blue-800/30' :
                  macro.color === 'green' ? 'bg-green-950/20 border-green-800/30' :
                  'bg-yellow-950/20 border-yellow-800/30'
                }`}>
                  <div className={`text-2xl font-black ${
                    macro.color === 'red' ? 'text-red-400' :
                    macro.color === 'blue' ? 'text-blue-400' :
                    macro.color === 'green' ? 'text-green-400' : 'text-yellow-400'
                  }`}>{macro.value}</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{macro.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Diet Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="font-black text-white">Meal Schedule</h2>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sorted?.map((meal: any, i: number) => (
                <div key={meal.id} className="px-6 py-5 hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <h3 className="font-bold text-white text-sm">{meal.meal_time}</h3>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed pl-4">{meal.food_items}</p>
                      {meal.notes && <p className="text-zinc-600 text-xs mt-1 pl-4 italic">{meal.notes}</p>}
                    </div>
                    {meal.calories && (
                      <div className="shrink-0 text-right">
                        <div className="text-base font-black text-white">{meal.calories}</div>
                        <div className="text-xs text-zinc-600">kcal</div>
                        {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                          <div className="text-xs text-zinc-600 mt-1 space-y-0.5">
                            <div>P: <span className="text-blue-400">{meal.protein_g}g</span></div>
                            <div>C: <span className="text-green-400">{meal.carbs_g}g</span></div>
                            <div>F: <span className="text-yellow-400">{meal.fat_g}g</span></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
