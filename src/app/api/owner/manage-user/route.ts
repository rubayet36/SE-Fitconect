import { NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * PATCH /api/owner/manage-user
 * Owner administrative endpoint to:
 * 1. Assign/change user role ('member' <-> 'trainer')
 * 2. Block or pause user access ('active' | 'paused' | 'blocked')
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    // 1. Authenticate caller
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorize — must be owner
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as any

    if (callerProfile?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden — only the gym owner can manage user roles and access status' },
        { status: 403 }
      )
    }

    // 3. Parse and validate body
    let body: Record<string, any>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { user_id, action, role, status } = body as {
      user_id: string
      action: 'update_role' | 'update_status'
      role?: 'member' | 'trainer'
      status?: 'active' | 'paused' | 'blocked'
    }

    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and action' },
        { status: 400 }
      )
    }

    // 4. Fetch target profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single() as any

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Safeguard: Owner cannot modify their own owner role or block themselves
    if (targetProfile.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify role or access status of gym owner account' },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (action === 'update_role') {
      if (!role || !['member', 'trainer'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role value. Must be "member" or "trainer".' },
          { status: 400 }
        )
      }
      updatePayload.role = role
    } else if (action === 'update_status') {
      if (!status || !['active', 'paused', 'blocked'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value. Must be "active", "paused", or "blocked".' },
          { status: 400 }
        )
      }
      updatePayload.status = status
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "update_role" or "update_status".' },
        { status: 400 }
      )
    }

    // 5. Update profile in database
    // Use admin client if service role key is available to bypass any RLS locks
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const clientToUse = serviceRoleKey
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
      : supabase

    const { data: updatedProfile, error: updateError } = await clientToUse
      .from('profiles')
      .update(updatePayload)
      .eq('id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('[manage-user] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Sync user_metadata in Supabase Auth if role changed and admin client exists
    if (serviceRoleKey && action === 'update_role' && role) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: { role },
        })
      } catch (authAdminError) {
        console.warn('[manage-user] Auth metadata sync warning:', authAdminError)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message:
        action === 'update_role'
          ? `User promoted/changed to ${role} successfully`
          : `User access status updated to ${status} successfully`,
    })
  } catch (err: any) {
    console.error('[manage-user] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
