import webpush from 'web-push'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 0. Initialize services dynamically to avoid Next.js build-time errors
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privKey = process.env.VAPID_PRIVATE_KEY
    if (!pubKey || !privKey) {
      console.error('VAPID keys missing')
      return NextResponse.json({ error: 'Push not configured' }, { status: 500 })
    }

    webpush.setVapidDetails(
      'mailto:' + (process.env.GMAIL_EMAIL || 'admin@vortexfitness.club'),
      pubKey.trim(),
      privKey.trim()
    )

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()

    // 1. SUBSCRIBE a user (called from the Member Dashboard when they click 'Allow')
    if (body.action === 'subscribe') {
      const { userId, subscription } = body
      if (!userId || !subscription) return NextResponse.json({ error: 'Missing logic' }, { status: 400 })

      const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: subscription })
        .eq('id', userId)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Subscribed to push' })
    }

    // 2. BROADCAST (called from the Trainer Billboard when posting a notice)
    if (body.action === 'broadcast') {
      const { title, message } = body

      // Get all members who have a push_subscription saved
      const { data: members, error } = await supabase
        .from('profiles')
        .select('push_subscription')
        .eq('role', 'member')
        .not('push_subscription', 'is', null)

      if (error) throw error
      if (!members || members.length === 0) {
        return NextResponse.json({ success: true, message: 'No subscribed members to notify' })
      }

      // Loop through and send the push to each valid subscription
      const payload = JSON.stringify({ title, body: message })
      
      const sendPromises = members.map(async (m) => {
        try {
          // The database stores it as a JSON object, passed directly to web-push
          await webpush.sendNotification(m.push_subscription, payload)
        } catch (err: any) {
          // If the subscription is expired (410), we could optionally delete it from DB here
          console.log('Failed to send to one user. Might be expired token.', err.statusCode)
        }
      })

      // We don't block the request if 1 push fails, we wait for all to try
      await Promise.allSettled(sendPromises)
      
      return NextResponse.json({ success: true, sentCount: members.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('Push Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
