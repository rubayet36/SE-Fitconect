import { NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/timetable – public, returns all timetable rows
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('gym_timetable')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PUT /api/timetable – owner-only, update a row
export async function PUT(req: Request) {
  const supabaseServer = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden – only the owner can update the timetable' }, { status: 403 })
  }

  const body = await req.json()
  const { id, day_label, open_time, close_time, is_closed } = body

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (id) {
    // Update existing row
    const { error } = await supabaseAdmin
      .from('gym_timetable')
      .update({ day_label, open_time, close_time, is_closed, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Insert new row
    const { error } = await supabaseAdmin
      .from('gym_timetable')
      .insert({ day_label, open_time, close_time, is_closed: is_closed ?? false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/timetable – owner-only, delete a row
export async function DELETE(req: Request) {
  const supabaseServer = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await req.json()
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { error } = await supabaseAdmin.from('gym_timetable').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
