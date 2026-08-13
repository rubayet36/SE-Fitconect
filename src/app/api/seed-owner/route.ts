import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// One-time route to seed the owner profile after creating the auth user in Supabase Dashboard.
// Call: GET /api/seed-owner  (just visit in browser)
// This inserts/updates the profile row for the owner email with role='owner'.
export async function GET() {
  const OWNER_EMAIL = 'vortexfitnessclub001@gmail.com'

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Find the auth user by email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const ownerUser = users.find(u => u.email === OWNER_EMAIL)
  if (!ownerUser) {
    return NextResponse.json({
      error: `Auth user ${OWNER_EMAIL} not found. Please create it in Supabase Dashboard → Authentication → Users first.`
    }, { status: 404 })
  }

  // Upsert the profile with role='owner'
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: ownerUser.id,
    email: OWNER_EMAIL,
    full_name: 'Vortex Owner',
    role: 'owner',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Owner profile seeded successfully', userId: ownerUser.id })
}
