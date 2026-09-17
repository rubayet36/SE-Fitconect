import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/gamification/leaderboard
 * Returns top 20 members ranked by total_points.
 * Accessible to any authenticated user.
 *
 * Response shape:
 * {
 *   data: Array<{
 *     member_id: string
 *     total_points: number
 *     weekly_points: number
 *     streak_days: number
 *     profiles: { full_name: string | null, avatar_url: string | null }
 *   }>
 * }
 */
export async function GET() {
  const supabase = await createClient()

  // Authenticate — leaderboard requires login
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('member_points')
    .select(`
      total_points,
      weekly_points,
      monthly_points,
      streak_days,
      member_id,
      last_activity_date,
      updated_at,
      profiles!inner(full_name, avatar_url)
    `)
    .order('total_points', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[leaderboard] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
