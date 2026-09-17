import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/gamification/log-exercise
 * Member submits an exercise log for trainer approval.
 *
 * Body:
 *   trainer_id      string  (UUID) — the trainer assigned to this member
 *   exercise_name   string  — display name of the exercise
 *   exercise_db_id  string? — ExerciseDB API id (optional)
 *   sets_completed  number  — number of sets completed
 *   reps_completed  string  — reps (e.g. "10" or "10-12")
 *   duration_mins   number? — total workout duration in minutes
 *   notes           string? — optional member notes
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    trainer_id,
    exercise_name,
    exercise_db_id,
    sets_completed,
    reps_completed,
    duration_mins,
    notes,
  } = body as {
    trainer_id: string
    exercise_name: string
    exercise_db_id?: string
    sets_completed: number
    reps_completed: string
    duration_mins?: number
    notes?: string
  }

  // Basic validation
  if (!trainer_id || !exercise_name || !sets_completed || !reps_completed) {
    return NextResponse.json(
      { error: 'Missing required fields: trainer_id, exercise_name, sets_completed, reps_completed' },
      { status: 400 }
    )
  }

  const { data, error } = await (supabase
    .from('exercise_logs') as any)
    .insert({
      member_id: user.id,
      trainer_id,
      exercise_name,
      exercise_db_id: exercise_db_id ?? null,
      sets_completed,
      reps_completed,
      duration_mins: duration_mins ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[log-exercise] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
