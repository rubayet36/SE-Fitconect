import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/gamification/approve
 * Trainer approves or rejects a pending exercise log.
 * The `award_points_on_approval` DB trigger fires automatically on approval.
 *
 * Body:
 *   log_id  string  — UUID of the exercise_logs row
 *   status  'approved' | 'rejected'
 */
export async function PATCH(request: Request) {
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

  const { log_id, status } = body as { log_id: string; status: string }

  // Validate inputs
  if (!log_id) {
    return NextResponse.json({ error: 'Missing required field: log_id' }, { status: 400 })
  }
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status value. Must be "approved" or "rejected".' },
      { status: 400 }
    )
  }

  // RLS policy ensures only the assigned trainer can update this row
  const { data, error } = await supabase
    .from('exercise_logs')
    .update({ status })
    .eq('id', log_id)
    .eq('trainer_id', user.id)   // prevents trainers from approving others' logs
    .select()
    .single()

  if (error) {
    console.error('[approve] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Log not found or you are not the assigned trainer.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}
