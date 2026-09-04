import { NextResponse } from 'next/server'
import OpenAI from 'openai'

interface GenerateDietPayload {
  memberName?: string
  memberNotes?: string
  fitnessGoal?: string
  dietPreference?: string
  activityLevel?: string
  targetCalories?: number
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
  customPrompt?: string
}

const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
]

export async function POST(req: Request) {
  try {
    const payload: GenerateDietPayload = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({
        success: false,
        isFallback: true,
        error: 'OPENROUTER_API_KEY is not set. Get a free key at https://openrouter.ai/keys',
      })
    }

    const {
      memberName = 'Member',
      memberNotes = '',
      fitnessGoal = 'maintenance',
      dietPreference = 'standard',
      activityLevel = 'moderately_active',
      targetCalories = 2000,
      proteinGrams = 150,
      carbsGrams = 200,
      fatGrams = 60,
      customPrompt = '',
    } = payload

    const combinedNotes = [memberNotes, customPrompt].filter(Boolean).join(' | ') || 'None provided'

    const systemPrompt = `You are an elite sports nutritionist for Vortex Fitness Club. When asked to generate a diet plan, you MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation. Just pure JSON.`

    const userPrompt = `Create a personalized 5-phase daily diet chart for the following member.

Member Name: ${memberName}
Member Description & Notes: ${combinedNotes}
Fitness Goal: ${fitnessGoal}
Dietary Preference: ${dietPreference}
Activity Tier: ${activityLevel}
Target Daily Macros: ${targetCalories} kcal (Protein: ${proteinGrams}g, Carbs: ${carbsGrams}g, Fats: ${fatGrams}g)

RULES:
1. Exactly 5 meal phases: "Early Morning", "Breakfast", "Lunch", "Snacks", "Dinner".
2. All calories/protein_g/carbs_g/fat_g across 5 meals must sum to the daily targets.
3. Strictly follow the "${dietPreference}" dietary preference and any special notes/allergies.
4. Each meal must include an actionable coach tip in the "notes" field.

Output ONLY this JSON (no extra text):
{"dietSummary":"Brief strategy overview","meals":[{"meal_time":"Early Morning","food_items":"Specific foods with portions","calories":120,"protein_g":4,"carbs_g":6,"fat_g":8,"notes":"Coach tip"},{"meal_time":"Breakfast","food_items":"...","calories":500,"protein_g":40,"carbs_g":50,"fat_g":15,"notes":"..."},{"meal_time":"Lunch","food_items":"...","calories":650,"protein_g":50,"carbs_g":65,"fat_g":18,"notes":"..."},{"meal_time":"Snacks","food_items":"...","calories":300,"protein_g":28,"carbs_g":25,"fat_g":10,"notes":"..."},{"meal_time":"Dinner","food_items":"...","calories":430,"protein_g":28,"carbs_g":54,"fat_g":9,"notes":"..."}]}`

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://vortex-fitness.app',
        'X-Title': 'Vortex Fitness Club',
      },
    })

    let responseData: any = null
    let lastError = ''

    for (const model of OPENROUTER_MODELS) {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        })

        const rawText = completion.choices[0]?.message?.content || ''
        if (!rawText) {
          lastError = `Model ${model} returned empty content`
          continue
        }

        // Strip markdown fences if model included them
        let cleaned = rawText.trim()
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim()
        }

        // Extract first {...} JSON block in case model added preamble
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0]

        responseData = JSON.parse(cleaned)
        console.log(`✅ Diet plan generated with model: ${model}`)
        break
      } catch (err: any) {
        lastError = `Model ${model}: ${err?.message || String(err)}`
        console.warn(`⚠ ${lastError}`)
      }
    }

    if (!responseData || !Array.isArray(responseData.meals)) {
      return NextResponse.json({
        success: false,
        isFallback: true,
        error: `AI execution failed: ${lastError}`,
      })
    }

    return NextResponse.json({
      success: true,
      isFallback: false,
      dietSummary: responseData.dietSummary || '',
      meals: responseData.meals,
    })
  } catch (err: any) {
    console.error('OpenRouter Diet Generation Error:', err)
    return NextResponse.json(
      { success: false, isFallback: true, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
