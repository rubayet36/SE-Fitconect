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

  const { log_id, status } = body as { log_id: string; status: 'approved' | 'rejected' }

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

  const reviewedAt = new Date().toISOString()

  // RLS policy ensures only the assigned trainer can update this row
  const { data, error } = await supabase
    .from('exercise_logs')
    .update({
      status,
      reviewed_at: reviewedAt,
    })
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

  // Fallback: If trigger was not installed on Supabase, compute and credit points directly
  if (status === 'approved' && (!data.points_awarded || data.points_awarded === 0)) {
    const sets = data.sets_completed || 1
    const duration = data.duration_mins || 0
    const calculatedPoints = 10 + (sets * 2) + (duration >= 30 ? 5 : 0)

    // Update log with calculated points
    await supabase
      .from('exercise_logs')
      .update({ points_awarded: calculatedPoints })
      .eq('id', data.id)

    data.points_awarded = calculatedPoints

    // Update or insert member_points
    const { data: existingPoints } = await supabase
      .from('member_points')
      .select('*')
      .eq('member_id', data.member_id)
      .maybeSingle()

    const today = new Date().toISOString().split('T')[0]
    let newStreak = 1
    if (existingPoints?.last_activity_date) {
      const lastDate = new Date(existingPoints.last_activity_date)
      const diffDays = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        newStreak = (existingPoints.streak_days || 0) + 1
      } else if (diffDays === 0) {
        newStreak = existingPoints.streak_days || 1
      }
    }

    if (existingPoints) {
      await supabase
        .from('member_points')
        .update({
          total_points: (existingPoints.total_points || 0) + calculatedPoints,
          weekly_points: (existingPoints.weekly_points || 0) + calculatedPoints,
          monthly_points: (existingPoints.monthly_points || 0) + calculatedPoints,
          streak_days: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', data.member_id)
    } else {
      await supabase
        .from('member_points')
        .insert({
          member_id: data.member_id,
          total_points: calculatedPoints,
          weekly_points: calculatedPoints,
          monthly_points: calculatedPoints,
          streak_days: 1,
          last_activity_date: today,
        })
    }

    // Insert point transaction audit
    await supabase
      .from('point_transactions')
      .insert({
        member_id: data.member_id,
        exercise_log_id: data.id,
        points: calculatedPoints,
        reason: `Exercise approved: ${data.exercise_name}`,
        awarded_by: user.id,
      })
  }

  return NextResponse.json({ success: true, data })
}
