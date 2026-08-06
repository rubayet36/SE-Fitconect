import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// ──────────────────────────────────────────────────────────
//  Email HTML builders
// ──────────────────────────────────────────────────────────

function workoutEmail(memberName: string, trainerName: string, dayCount: number, exerciseCount: number) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#71717a;font-weight:600;">VORTEX FITNESS CLUB</p>
        <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">💪 New Workout Plan</h1>
        <p style="margin:8px 0 0;color:#71717a;font-size:14px;">Your trainer has sent you a personalized plan</p>
      </td></tr>
      <tr><td style="background:#09090b;border-left:1px solid #27272a;border-right:1px solid #27272a;padding:32px;">
        <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
          Hey <strong style="color:#ffffff;">${memberName}</strong>! 🎉
          Your trainer <strong style="color:#ef4444;">${trainerName}</strong> has just assigned you a brand new workout plan.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:48%;">
              <div style="font-size:32px;font-weight:900;color:#ef4444;">${dayCount}</div>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:600;">Training Days</div>
            </td>
            <td width="4%"></td>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:48%;">
              <div style="font-size:32px;font-weight:900;color:#ef4444;">${exerciseCount}</div>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:600;">Total Exercises</div>
            </td>
          </tr>
        </table>
        <p style="margin:0;color:#52525b;font-size:13px;">Log in to view your full workout schedule, sets, reps, and trainer notes.</p>
      </td></tr>
      <tr><td style="background:#18181b;border:1px solid #27272a;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
        <p style="margin:0;color:#3f3f46;font-size:12px;">Vortex Fitness Club &mdash; Member Notifications</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function dietEmail(memberName: string, trainerName: string, mealCount: number, totalCalories: number) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#71717a;font-weight:600;">VORTEX FITNESS CLUB</p>
        <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">🥗 New Diet Chart</h1>
        <p style="margin:8px 0 0;color:#71717a;font-size:14px;">Your personalised nutrition plan is ready</p>
      </td></tr>
      <tr><td style="background:#09090b;border-left:1px solid #27272a;border-right:1px solid #27272a;padding:32px;">
        <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
          Hey <strong style="color:#ffffff;">${memberName}</strong>! 🎉
          Your trainer <strong style="color:#ef4444;">${trainerName}</strong> has created a customised diet chart for your goals.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:48%;">
              <div style="font-size:32px;font-weight:900;color:#22c55e;">${mealCount}</div>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:600;">Meals Per Day</div>
            </td>
            <td width="4%"></td>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:48%;">
              <div style="font-size:32px;font-weight:900;color:#22c55e;">${totalCalories}</div>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:600;">Daily Calories</div>
            </td>
          </tr>
        </table>
        <p style="margin:0;color:#52525b;font-size:13px;">Log in to see your full meal schedule, macros, and food items.</p>
      </td></tr>
      <tr><td style="background:#18181b;border:1px solid #27272a;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
        <p style="margin:0;color:#3f3f46;font-size:12px;">Vortex Fitness Club &mdash; Member Notifications</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

// ──────────────────────────────────────────────────────────
//  Main handler
// ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error('[notify] Missing GMAIL credentials in environment variables')
      return NextResponse.json({ 
        error: 'Email service not configured on server (Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD)' 
      }, { status: 500 })
    }

    const body = await req.json()
    const { type, to, payload } = body as {
      type: 'workout' | 'diet'
      to: string[]          // array of email addresses
      payload: Record<string, any>
    }

    console.log('[notify] Attempting to send email to:', to)

    if (!to || to.length === 0) {
      return NextResponse.json({ error: 'No recipients' }, { status: 400 })
    }

    // Verify transporter connection
    try {
      await transporter.verify()
      console.log('[notify] SMTP connection verified successfully')
    } catch (vErr: any) {
      console.error('[notify] SMTP Verification failed:', vErr)
      return NextResponse.json({ error: 'SMTP Login Failed: ' + vErr.message }, { status: 500 })
    }

    let subject = ''
    let html = ''

    if (type === 'workout') {
      subject = `💪 Your new workout plan is ready, ${payload.memberName}!`
      html = workoutEmail(payload.memberName, payload.trainerName, payload.dayCount, payload.exerciseCount)
    } else if (type === 'diet') {
      subject = `🥗 Your diet chart is ready, ${payload.memberName}!`
      html = dietEmail(payload.memberName, payload.trainerName, payload.mealCount, payload.totalCalories)
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    // Send using Gmail SMTP
    const fromAddress = process.env.GMAIL_EMAIL || 'vortexfitness@gmail.com'
    
    // We use a regular loop for better error capture per-email
    const results = []
    for (const email of to) {
      console.log(`[notify] Sending to ${email}...`)
      try {
        const info = await transporter.sendMail({
          from: `"Vortex Fitness Club" <${fromAddress}>`,
          to: email,
          subject,
          html,
        })
        console.log(`[notify] Success for ${email}:`, info.messageId)
        results.push({ email, success: true, messageId: info.messageId })
      } catch (sendErr: any) {
        console.error(`[notify] Failed for ${email}:`, sendErr)
        results.push({ email, success: false, error: sendErr.message })
      }
    }

    const allSuccess = results.every(r => r.success)
    return NextResponse.json({ 
      success: allSuccess, 
      results,
      totalSent: results.filter(r => r.success).length 
    })
  } catch (err: any) {
    console.error('[notify] Global Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

