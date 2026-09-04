import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// ──────────────────────────────────────────────────────────
//  SMTP Transporter Factory
// ──────────────────────────────────────────────────────────

function isPlaceholder(val: string | null | undefined): boolean {
  if (!val) return true
  const lower = val.toLowerCase().trim()
  return (
    lower.includes('dummy') ||
    lower.includes('placeholder') ||
    lower.includes('your-google-app-password') ||
    lower.includes('your-configured-sender') ||
    lower.includes('your-email') ||
    lower === 'undefined' ||
    lower === 'null'
  )
}

function getTransporter() {
  const user = process.env.GMAIL_EMAIL || process.env.SMTP_USER
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || ''
  const pass = rawPass.replace(/\s+/g, '') // strip any spaced formatting

  if (!user || !pass || isPlaceholder(user) || isPlaceholder(pass)) {
    return null
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
}

// ──────────────────────────────────────────────────────────
//  HTML Sanitization Helper
// ──────────────────────────────────────────────────────────

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ──────────────────────────────────────────────────────────
//  Rich HTML Email Templates
// ──────────────────────────────────────────────────────────

interface DietEmailPayload {
  memberName: string
  trainerName?: string
  mealCount?: number
  totalCalories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fitnessGoal?: string
  dietPreference?: string
  notes?: string
  meals?: Array<{
    meal_time: string
    food_items: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  }>
  portalUrl?: string
}

function buildDietEmailHtml(payload: DietEmailPayload, siteUrl: string): { html: string; text: string } {
  const memberName = escapeHtml(payload.memberName || 'Athlete')
  const trainerName = escapeHtml(payload.trainerName || 'Your Trainer')
  const mealCount = payload.mealCount || payload.meals?.length || 5
  const totalCalories = payload.totalCalories || 0
  const protein = payload.protein_g || 0
  const carbs = payload.carbs_g || 0
  const fat = payload.fat_g || 0
  const goal = escapeHtml(payload.fitnessGoal ? payload.fitnessGoal.replace(/_/g, ' ').toUpperCase() : 'FITNESS')
  const preference = escapeHtml(payload.dietPreference ? payload.dietPreference.toUpperCase() : 'STANDARD')
  const actionUrl = payload.portalUrl || `${siteUrl}/member/diet`
  const coachNotes = payload.notes ? escapeHtml(payload.notes) : ''

  // Meals preview table rows
  const mealsList = payload.meals || []
  let mealsHtml = ''
  if (mealsList.length > 0) {
    mealsHtml = `
      <div style="margin:24px 0 16px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a1a1aa;">Daily Meal Schedule Preview</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #27272a;border-radius:12px;overflow:hidden;background:#121215;">
          ${mealsList.map((m, idx) => `
            <tr style="border-bottom:${idx === mealsList.length - 1 ? 'none' : '1px solid #27272a'};">
              <td style="padding:14px 16px;width:30%;vertical-align:top;">
                <span style="display:inline-block;padding:3px 8px;background:#ef444420;border:1px solid #ef444440;border-radius:6px;color:#f87171;font-size:11px;font-weight:800;text-transform:uppercase;">
                  ${escapeHtml(m.meal_time)}
                </span>
                ${m.calories ? `<div style="font-size:12px;color:#71717a;margin-top:4px;font-weight:600;">${m.calories} kcal</div>` : ''}
              </td>
              <td style="padding:14px 16px;color:#e4e4e7;font-size:13px;line-height:1.5;vertical-align:top;">
                ${escapeHtml(m.food_items)}
                ${m.protein_g || m.carbs_g || m.fat_g ? `
                  <div style="margin-top:6px;font-size:11px;color:#71717a;font-family:monospace;">
                    <span style="color:#60a5fa;">P: ${m.protein_g || 0}g</span> &bull; 
                    <span style="color:#4ade80;">C: ${m.carbs_g || 0}g</span> &bull; 
                    <span style="color:#facc15;">F: ${m.fat_g || 0}g</span>
                  </div>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Personalized Diet Plan is Ready</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#09090b;border:1px solid #27272a;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #18181b 0%, #1c0d0d 50%, #2b0c0c 100%);padding:36px 32px;text-align:center;border-bottom:1px solid #3f1515;">
              <table align="center" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="background:#ef4444;border-radius:10px;padding:6px 14px;color:#ffffff;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
                    VORTEX FITNESS CLUB
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                🥗 Nutrition Plan Published!
              </h1>
              <p style="margin:0;color:#a1a1aa;font-size:14px;">
                Custom Nutrition Chart prepared by Coach <strong style="color:#f87171;">${trainerName}</strong>
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#e4e4e7;">
                Hey <strong style="color:#ffffff;">${memberName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Your trainer has designed a precision macronutrient nutrition plan tailored to support your 
                <strong style="color:#ffffff;">${goal}</strong> journey (${preference} protocol). 
                Here is a summary of your daily metabolic targets:
              </p>

              <!-- Macro Dashboard Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:23%;">
                    <div style="font-size:20px;font-weight:900;color:#ef4444;">${totalCalories}</div>
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:700;margin-top:2px;">Calories</div>
                  </td>
                  <td width="2.6%"></td>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:23%;">
                    <div style="font-size:20px;font-weight:900;color:#60a5fa;">${protein}g</div>
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:700;margin-top:2px;">Protein</div>
                  </td>
                  <td width="2.6%"></td>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:23%;">
                    <div style="font-size:20px;font-weight:900;color:#4ade80;">${carbs}g</div>
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:700;margin-top:2px;">Carbs</div>
                  </td>
                  <td width="2.6%"></td>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;width:23%;">
                    <div style="font-size:20px;font-weight:900;color:#facc15;">${fat}g</div>
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:700;margin-top:2px;">Fats</div>
                  </td>
                </tr>
              </table>

              <!-- Meals Preview Section -->
              ${mealsHtml}

              <!-- Coach Guidance Box -->
              ${coachNotes ? `
                <div style="background:#18181b;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ef4444;">Trainer's Coaching Notes</p>
                  <p style="margin:0;font-size:13px;color:#d4d4d8;font-style:italic;line-height:1.5;">"${coachNotes}"</p>
                </div>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" target="_blank" style="display:inline-block;background:#dc2626;background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);color:#ffffff;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 36px;border-radius:12px;box-shadow:0 6px 20px rgba(220,38,38,0.4);">
                      Open My Diet Chart &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:#52525b;text-align:center;">
                Or copy and paste this URL into your browser: <br/>
                <a href="${actionUrl}" style="color:#71717a;text-decoration:underline;">${actionUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#121215;border-top:1px solid #27272a;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-weight:600;">
                VORTEX FITNESS CLUB &bull; Automated Member Notifications
              </p>
              <p style="margin:0;color:#3f3f46;font-size:11px;">
                You received this email because a trainer assigned a fitness schedule to your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `VORTEX FITNESS CLUB — NUTRITION PLAN PUBLISHED

Hey ${payload.memberName || 'Athlete'},
Your trainer ${payload.trainerName || 'Your Trainer'} has published your customized diet chart!

DAILY METRIC TARGETS:
- Calories: ${totalCalories} kcal
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fats: ${fat}g
- Meals Per Day: ${mealCount}

Log into your portal to view your complete meal schedule:
${actionUrl}
`

  return { html, text }
}

interface WorkoutEmailPayload {
  memberName: string
  trainerName?: string
  dayCount?: number
  exerciseCount?: number
  focusGoal?: string
  routinesPreview?: Array<{ day_label: string; exercise_name: string; sets?: number; reps?: string }>
  notes?: string
  portalUrl?: string
}

function buildWorkoutEmailHtml(payload: WorkoutEmailPayload, siteUrl: string): { html: string; text: string } {
  const memberName = escapeHtml(payload.memberName || 'Athlete')
  const trainerName = escapeHtml(payload.trainerName || 'Your Trainer')
  const dayCount = payload.dayCount || 0
  const exerciseCount = payload.exerciseCount || 0
  const actionUrl = payload.portalUrl || `${siteUrl}/member/my-plan`
  const coachNotes = payload.notes ? escapeHtml(payload.notes) : ''

  const routinesList = payload.routinesPreview || []
  let routinesHtml = ''
  if (routinesList.length > 0) {
    routinesHtml = `
      <div style="margin:24px 0 16px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a1a1aa;">Routine Highlights</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #27272a;border-radius:12px;overflow:hidden;background:#121215;">
          ${routinesList.map((r, idx) => `
            <tr style="border-bottom:${idx === routinesList.length - 1 ? 'none' : '1px solid #27272a'};">
              <td style="padding:12px 16px;width:35%;color:#f87171;font-size:12px;font-weight:800;text-transform:uppercase;">
                ${escapeHtml(r.day_label)}
              </td>
              <td style="padding:12px 16px;color:#ffffff;font-size:13px;font-weight:600;">
                ${escapeHtml(r.exercise_name)}
                ${r.sets && r.reps ? `<span style="color:#71717a;font-size:11px;margin-left:8px;font-weight:normal;">(${r.sets} sets &times; ${escapeHtml(r.reps)})</span>` : ''}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your New Workout Routine is Ready</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#09090b;border:1px solid #27272a;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #18181b 0%, #1c0d0d 50%, #2b0c0c 100%);padding:36px 32px;text-align:center;border-bottom:1px solid #3f1515;">
              <table align="center" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="background:#ef4444;border-radius:10px;padding:6px 14px;color:#ffffff;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
                    VORTEX FITNESS CLUB
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                💪 Workout Routine Assigned!
              </h1>
              <p style="margin:0;color:#a1a1aa;font-size:14px;">
                Personalized Training Split prepared by Coach <strong style="color:#f87171;">${trainerName}</strong>
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#e4e4e7;">
                Hey <strong style="color:#ffffff;">${memberName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Your trainer <strong style="color:#ef4444;">${trainerName}</strong> has built and published your brand new workout routine.
                Get ready to push your performance to the next level!
              </p>

              <!-- Workout Metrics Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;text-align:center;width:48%;">
                    <div style="font-size:28px;font-weight:900;color:#ef4444;">${dayCount}</div>
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:700;margin-top:4px;">Training Days</div>
                  </td>
                  <td width="4%"></td>
                  <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;text-align:center;width:48%;">
                    <div style="font-size:28px;font-weight:900;color:#ef4444;">${exerciseCount}</div>
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#71717a;font-weight:700;margin-top:4px;">Total Exercises</div>
                  </td>
                </tr>
              </table>

              ${routinesHtml}

              <!-- Coach Guidance Box -->
              ${coachNotes ? `
                <div style="background:#18181b;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ef4444;">Trainer's Coaching Notes</p>
                  <p style="margin:0;font-size:13px;color:#d4d4d8;font-style:italic;line-height:1.5;">"${coachNotes}"</p>
                </div>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" target="_blank" style="display:inline-block;background:#dc2626;background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);color:#ffffff;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 36px;border-radius:12px;box-shadow:0 6px 20px rgba(220,38,38,0.4);">
                      View Full Workout Plan &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:#52525b;text-align:center;">
                Or copy and paste this URL into your browser: <br/>
                <a href="${actionUrl}" style="color:#71717a;text-decoration:underline;">${actionUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#121215;border-top:1px solid #27272a;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-weight:600;">
                VORTEX FITNESS CLUB &bull; Member Notifications
              </p>
              <p style="margin:0;color:#3f3f46;font-size:11px;">
                You received this email because a trainer assigned a fitness routine to your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `VORTEX FITNESS CLUB — WORKOUT ROUTINE ASSIGNED

Hey ${payload.memberName || 'Athlete'},
Your trainer ${payload.trainerName || 'Your Trainer'} has built your custom workout plan!

ROUTINE OVERVIEW:
- Training Days: ${dayCount}
- Total Exercises: ${exerciseCount}

Log into your portal to see complete sets, reps, and exercise instructions:
${actionUrl}
`

  return { html, text }
}

interface GeneralEmailPayload {
  title?: string
  message: string
  memberName?: string
  actionText?: string
  actionUrl?: string
}

function buildGeneralEmailHtml(payload: GeneralEmailPayload, siteUrl: string): { html: string; text: string } {
  const memberName = escapeHtml(payload.memberName || 'Athlete')
  const title = escapeHtml(payload.title || 'Notification from Vortex Fitness Club')
  const message = escapeHtml(payload.message)
  const actionUrl = payload.actionUrl || `${siteUrl}/member/dashboard`
  const actionText = escapeHtml(payload.actionText || 'Open Member Dashboard')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#09090b;border:1px solid #27272a;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
          <tr>
            <td style="background:linear-gradient(135deg, #18181b 0%, #1c0d0d 50%, #2b0c0c 100%);padding:32px;text-align:center;border-bottom:1px solid #3f1515;">
              <table align="center" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td style="background:#ef4444;border-radius:10px;padding:5px 12px;color:#ffffff;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
                    VORTEX FITNESS CLUB
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#e4e4e7;">Hey <strong style="color:#ffffff;">${memberName}</strong>,</p>
              <div style="font-size:14px;line-height:1.7;color:#d4d4d8;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px;">
                ${message.replace(/\n/g, '<br/>')}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" target="_blank" style="display:inline-block;background:#ef4444;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      ${actionText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#121215;border-top:1px solid #27272a;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:11px;">Vortex Fitness Club &bull; Member Notifications</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return {
    html,
    text: `VORTEX FITNESS CLUB\n\nHey ${payload.memberName || 'Athlete'},\n\n${payload.message}\n\n${actionUrl}`
  }
}

// ──────────────────────────────────────────────────────────
//  GET: Health & Diagnostics
// ──────────────────────────────────────────────────────────

export async function GET() {
  const user = process.env.GMAIL_EMAIL || process.env.SMTP_USER || null
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || ''
  const hasValidCreds = Boolean(user && rawPass && !isPlaceholder(user) && !isPlaceholder(rawPass))

  let connectionStatus = 'unconfigured'
  let connectionError: string | null = null

  if (hasValidCreds) {
    const transporter = getTransporter()
    if (transporter) {
      try {
        await transporter.verify()
        connectionStatus = 'connected'
      } catch (err: unknown) {
        connectionStatus = 'auth_failed'
        connectionError = err instanceof Error ? err.message : String(err)
      }
    }
  } else if (user || rawPass) {
    connectionStatus = 'simulation_mode'
  }

  return NextResponse.json({
    service: 'Vortex Automated SMTP Dispatcher',
    status: connectionStatus,
    configured: hasValidCreds,
    simulationMode: !hasValidCreds,
    senderEmail: user ? user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    supportedTypes: ['diet', 'workout', 'general'],
    error: connectionError,
  })
}

// ──────────────────────────────────────────────────────────
//  POST: Dispatch Notification Email
// ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, to, payload } = body as {
      type: 'workout' | 'diet' | 'general'
      to: string[] | string
      payload: Record<string, unknown>
    }

    // Normalize recipients
    const recipients: string[] = Array.isArray(to)
      ? to.filter((e): e is string => typeof e === 'string' && Boolean(e.trim()))
      : typeof to === 'string' && to.trim()
      ? [to.trim()]
      : []

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipient email addresses provided' }, { status: 400 })
    }

    // Derive base URL for CTA links
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000'
    const siteUrl = origin.startsWith('http') ? origin : `https://${origin}`

    // Render email template
    let subject = ''
    let html = ''
    let text = ''

    if (type === 'diet') {
      const dietPayload = payload as unknown as DietEmailPayload
      const memberName = dietPayload.memberName || 'Athlete'
      subject = `🥗 Your Personalized Diet Plan is Ready, ${memberName}!`
      const rendered = buildDietEmailHtml(dietPayload, siteUrl)
      html = rendered.html
      text = rendered.text
    } else if (type === 'workout') {
      const workoutPayload = payload as unknown as WorkoutEmailPayload
      const memberName = workoutPayload.memberName || 'Athlete'
      subject = `💪 Your New Workout Routine is Ready, ${memberName}!`
      const rendered = buildWorkoutEmailHtml(workoutPayload, siteUrl)
      html = rendered.html
      text = rendered.text
    } else if (type === 'general') {
      const genPayload = payload as unknown as GeneralEmailPayload
      subject = genPayload.title || 'Important Notice from Vortex Fitness Club'
      const rendered = buildGeneralEmailHtml(genPayload, siteUrl)
      html = rendered.html
      text = rendered.text
    } else {
      return NextResponse.json({ error: `Unsupported notification type: ${type}` }, { status: 400 })
    }

    const transporter = getTransporter()
    const senderEmail = process.env.GMAIL_EMAIL || process.env.SMTP_USER

    // Fallback: If SMTP is not configured or using placeholder in dev, log & simulate gracefully
    if (!transporter || !senderEmail || isPlaceholder(senderEmail)) {
      console.warn('[notify] SMTP credentials missing or placeholder — simulating email delivery in development')
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email dispatch simulated (live delivery requires configured GMAIL_APP_PASSWORD in .env.local)',
        recipients,
        subject,
        previewLength: html.length,
      })
    }

    // Dispatch emails
    const fromAddress = `"Vortex Fitness Club" <${senderEmail}>`
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = []

    for (const email of recipients) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          text,
          html,
        })
        results.push({ email, success: true, messageId: info.messageId })
      } catch (sendErr: unknown) {
        const errMessage = sendErr instanceof Error ? sendErr.message : String(sendErr)
        console.error(`[notify] Failed to send to ${email}:`, errMessage)
        results.push({ email, success: false, error: errMessage })
      }
    }

    const allSuccess = results.length > 0 && results.every((r) => r.success)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: allSuccess,
      totalSent: successCount,
      totalRequested: recipients.length,
      results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[notify] Fatal notification dispatcher error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

