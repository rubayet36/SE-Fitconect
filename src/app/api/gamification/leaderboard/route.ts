import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/gamification/leaderboard?timeframe=alltime|weekly
 * Returns top 20 members ranked by total_points or weekly_points.
 * Accessible to any authenticated user.
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  // Authenticate — leaderboard requires login
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') === 'weekly' ? 'weekly' : 'alltime'
  const sortColumn = timeframe === 'weekly' ? 'weekly_points' : 'total_points'

  // Attempt 1: Try join with profiles
  const { data: joinedData, error: joinError } = await supabase
    .from('member_points')
    .select(`
      total_points,
      weekly_points,
      monthly_points,
      streak_days,
      member_id,
      last_activity_date,
      updated_at,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order(sortColumn, { ascending: false })
    .limit(20)

  if (!joinError && joinedData) {
    return NextResponse.json({ data: joinedData, currentUserId: user.id })
  }

  // Fallback if relation join fails: fetch points then profiles separately
  const { data: pointsData, error: pointsError } = await supabase
    .from('member_points')
    .select('*')
    .order(sortColumn, { ascending: false })
    .limit(20)

  if (pointsError) {
    console.error('[leaderboard] Supabase error:', pointsError)
    return NextResponse.json({ error: pointsError.message }, { status: 500 })
  }

  const memberIds = (pointsData || []).map((p: any) => p.member_id)
  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}

  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', memberIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p: any) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      )
    }
  }

  const formatted = (pointsData || []).map((p: any) => ({
    ...p,
    profiles: profileMap[p.member_id] || { full_name: 'Member', avatar_url: null },
  }))

  return NextResponse.json({ data: formatted, currentUserId: user.id })
}
