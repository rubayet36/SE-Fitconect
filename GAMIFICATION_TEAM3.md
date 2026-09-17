# 💪 Gamification Feature — Team Member 3
## Role: Member Exercise Log Submission & Trainer Approval Panel Lead

---

## 📋 Overview

You are building the **two-sided interaction** at the heart of the gamification loop:
1. **Members** log exercises they've completed and submit them to their trainer
2. **Trainers** see a queue of pending logs, review them, and approve or reject with one click

This is the **core workflow** — without it, no points can ever be earned.

> ⚠️ **Dependency**: Team Member 1's API routes (`/api/gamification/log-exercise` and `/api/gamification/approve`) must be created first. You can mock the API calls with `console.log` while waiting.

---

## 🌿 Git Workflow — Your Branch

> ⚠️ **IMPORTANT**: All your work must be done on your own feature branch. Do **not** commit directly to `main`.

### Step 1 — Clone the repo (if not already done)
```bash
git clone <your-repo-url>
cd SE-Fitconect-main
```

### Step 2 — Make sure you are on the latest `main`
```bash
git checkout main
git pull origin main
```

### Step 3 — Create and switch to your feature branch
```bash
git checkout -b feature/gamification-log-approval
```
> This is **your branch name**. Only Team Member 3 uses this branch.

### Step 4 — Work on your tasks, then commit regularly
```bash
# After building the exercise log form:
git add .
git commit -m "feat: add member exercise log submission form"

# After ExerciseDB search integration:
git add .
git commit -m "feat: add ExerciseDB real-time search to log form"

# After trainer approval panel:
git add .
git commit -m "feat: add trainer exercise approval queue page"
```

### Step 5 — Push your branch to GitHub
```bash
git push origin feature/gamification-log-approval
```

### Step 6 — Open a Pull Request when done
1. Go to the GitHub repository
2. Click **"Compare & pull request"** for your branch
3. Set the base branch to `main`
4. Title: `[Team 3] Gamification Exercise Log & Trainer Approval`
5. Assign your teammates as reviewers
6. **Do not merge** — wait for at least 1 teammate to review

### ⚡ Branch Naming Convention
| Team Member | Branch Name |
|---|---|
| Member 1 | `feature/gamification-database-api` |
| Member 2 | `feature/gamification-leaderboard-ui` |
| **Member 3** (you) | `feature/gamification-log-approval` |
| Member 4 | `feature/gamification-badges-animations` |

---

## 📝 Task 1 — Exercise Log Submission Form (Member Side)

Create: `src/app/member/log-exercise/page.tsx`

### What to Build

A form that a member fills out after finishing a workout. It should allow them to:

1. **Search & Select an Exercise** — use the existing `ExerciseDB` integration from `src/lib/exercisedb.ts`
2. **Enter Sets, Reps, Duration** — number/text inputs
3. **Add optional notes** — textarea
4. **Choose their Trainer** — dropdown (loaded from Supabase, only their assigned trainer)
5. **Submit** — POST to `/api/gamification/log-exercise`

After submission: show a success toast with expected points preview (e.g., "✅ Logged! Your trainer will review it. You could earn ~14 points!").

### Form Component

```tsx
// src/app/member/log-exercise/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogExercisePage() {
  const supabase = createClient()
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
  const [form, setForm] = useState({
    trainer_id: '',
    exercise_name: '',
    exercise_db_id: '',
    sets_completed: 3,
    reps_completed: '10',
    duration_mins: 0,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Load the member's trainer(s) from existing requests table
    async function loadTrainers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('requests')
        .select('trainer_id, profiles!requests_trainer_id_fkey(full_name)')
        .eq('member_id', user.id)
        .eq('status', 'completed')
      // Deduplicate and set
      const unique = [...new Map((data || []).map(r => [r.trainer_id, r])).values()]
      setTrainers(unique.map(r => ({ id: r.trainer_id, full_name: (r.profiles as any)?.full_name || 'Trainer' })))
    }
    loadTrainers()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/gamification/log-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) setSuccess(true)
  }

  // Estimated points preview
  const estimatedPoints = 10 + (form.sets_completed * 2) + (Number(form.duration_mins) >= 30 ? 5 : 0)

  return (
    <div className="log-exercise-page">
      <h1>Log Your Workout 💪</h1>
      {success ? (
        <div className="success-toast">
          ✅ Exercise logged! Your trainer will review it. You could earn ~{estimatedPoints} pts!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="log-form">
          {/* Trainer selector */}
          <label>Select Trainer</label>
          <select value={form.trainer_id} onChange={e => setForm(f => ({ ...f, trainer_id: e.target.value }))} required>
            <option value="">-- Choose Trainer --</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>

          {/* Exercise name (text input; can enhance with ExerciseDB search later) */}
          <label>Exercise Name</label>
          <input
            type="text"
            value={form.exercise_name}
            onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))}
            placeholder="e.g. Bench Press"
            required
          />

          {/* Sets */}
          <label>Sets Completed</label>
          <input type="number" min={1} max={20} value={form.sets_completed}
            onChange={e => setForm(f => ({ ...f, sets_completed: Number(e.target.value) }))} required />

          {/* Reps */}
          <label>Reps (e.g. "12" or "8-10")</label>
          <input type="text" value={form.reps_completed}
            onChange={e => setForm(f => ({ ...f, reps_completed: e.target.value }))} required />

          {/* Duration */}
          <label>Duration (minutes)</label>
          <input type="number" min={0} value={form.duration_mins}
            onChange={e => setForm(f => ({ ...f, duration_mins: Number(e.target.value) }))} />

          {/* Notes */}
          <label>Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="How did it go?" rows={3} />

          {/* Points preview */}
          <div className="points-preview">
            ⚡ Estimated points if approved: <strong>{estimatedPoints} pts</strong>
          </div>

          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? 'Submitting...' : 'Submit Exercise Log 🚀'}
          </button>
        </form>
      )}
    </div>
  )
}
```

### Styling Notes

- Dark glassmorphism card form (consistent with the rest of the member dashboard)
- Input fields with glowing green border on focus (`border-color: #22c55e; box-shadow: 0 0 8px #22c55e44`)
- Points preview box with a soft amber glow (`background: rgba(251,191,36,0.1); border: 1px solid #fbbf24`)
- Submit button with gradient: `linear-gradient(135deg, #22c55e, #16a34a)`

---

## 🔍 Task 2 — ExerciseDB Search Integration (Enhancement)

Upgrade the Exercise Name field to use a **real-time search dropdown** using the ExerciseDB API already wired up in `src/lib/exercisedb.ts`.

```tsx
// Replace the plain text input in the form with a search component
import { searchExercises } from '@/lib/exercisedb'

function ExerciseSearch({ onSelect }: { onSelect: (name: string, id: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ name: string; id: string }[]>([])

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const timer = setTimeout(async () => {
      const data = await searchExercises(query)
      setResults(data.slice(0, 6).map((e: any) => ({ name: e.name, id: e.id })))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="exercise-search">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises..." />
      {results.length > 0 && (
        <ul className="search-dropdown">
          {results.map(r => (
            <li key={r.id} onClick={() => { onSelect(r.name, r.id); setQuery(r.name); setResults([]) }}>
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## ✅ Task 3 — Trainer Approval Panel

Edit: `src/app/trainer/dashboard/page.tsx` (add a new section) **OR** create `src/app/trainer/approvals/page.tsx`

### What to Build

A dedicated panel where the trainer sees all **pending exercise logs** from their members and can approve or reject each one.

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  📋 Pending Exercise Approvals          [2 Pending] 🔴  │
├─────────────────────────────────────────────────────────┤
│  Ahmed Khan                          Today, 2:30 PM      │
│  Bench Press · 3 sets × 12 reps · 45 mins               │
│  Notes: "Felt strong today, PB!"                        │
│  Expected: ⚡ 21 pts                                    │
│                           [✅ Approve] [❌ Reject]       │
├─────────────────────────────────────────────────────────┤
│  Sara Hossain                        Today, 11:00 AM     │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### Component Code

```tsx
// src/app/trainer/approvals/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ExerciseLog = {
  id: string
  exercise_name: string
  sets_completed: number
  reps_completed: string
  duration_mins: number | null
  notes: string | null
  submitted_at: string
  member: { full_name: string; avatar_url: string | null }
}

export default function ApprovalsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPendingLogs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('exercise_logs')
        .select('*, profiles!exercise_logs_member_id_fkey(full_name, avatar_url)')
        .eq('trainer_id', user.id)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false })
      setLogs((data || []).map(d => ({ ...d, member: d.profiles as any })))
      setLoading(false)
    }
    fetchPendingLogs()
  }, [])

  async function handleDecision(logId: string, status: 'approved' | 'rejected') {
    await fetch('/api/gamification/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id: logId, status }),
    })
    setLogs(prev => prev.filter(l => l.id !== logId))
  }

  const estimatedPts = (log: ExerciseLog) =>
    10 + (log.sets_completed * 2) + (log.duration_mins && log.duration_mins >= 30 ? 5 : 0)

  return (
    <div className="approvals-page">
      <h1>📋 Exercise Approvals</h1>
      {loading ? <p>Loading...</p> : logs.length === 0 ? (
        <p className="empty-state">🎉 All caught up! No pending approvals.</p>
      ) : (
        <div className="approval-list">
          {logs.map(log => (
            <div key={log.id} className="approval-card">
              <div className="approval-header">
                <strong>{log.member.full_name}</strong>
                <span className="time">{new Date(log.submitted_at).toLocaleString()}</span>
              </div>
              <div className="exercise-info">
                <span className="exercise-name">{log.exercise_name}</span>
                <span>{log.sets_completed} sets × {log.reps_completed}</span>
                {log.duration_mins && <span>{log.duration_mins} mins</span>}
              </div>
              {log.notes && <p className="log-notes">"{log.notes}"</p>}
              <div className="points-badge">⚡ ~{estimatedPts(log)} pts if approved</div>
              <div className="action-buttons">
                <button className="btn-approve" onClick={() => handleDecision(log.id, 'approved')}>
                  ✅ Approve
                </button>
                <button className="btn-reject" onClick={() => handleDecision(log.id, 'rejected')}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Styling for Approval Cards

```css
.approval-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}
.approval-card:hover { border-color: rgba(34,197,94,0.4); }
.btn-approve { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-reject  { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid #f87171; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
.points-badge { background: rgba(251,191,36,0.1); border: 1px solid #fbbf24; color: #fbbf24; border-radius: 9999px; padding: 0.2rem 0.75rem; display: inline-block; font-size: 0.85rem; margin: 0.5rem 0; }
```

---

## 🧭 Task 4 — Add Navigation Links

- **Member side**: Add **"💪 Log Exercise"** → `/member/log-exercise` to the member layout nav
- **Trainer side**: Add **"📋 Approvals"** → `/trainer/approvals` to the trainer layout nav (with a red badge showing pending count)

---

## ✅ Deliverables Checklist

- [ ] `/member/log-exercise/page.tsx` — form with trainer select, exercise input, sets/reps/duration
- [ ] Exercise search dropdown working via ExerciseDB API
- [ ] Points preview visible on the form
- [ ] Success toast shows after submission
- [ ] `/trainer/approvals/page.tsx` — trainer approval queue
- [ ] Approve/Reject buttons call the correct API route
- [ ] Card disappears after decision (optimistic UI)
- [ ] Nav link added to member and trainer layouts
- [ ] Both pages are mobile responsive

---

## 📅 Estimated Time
**6–8 hours** (Log form: 2.5h, ExerciseDB search: 1.5h, Trainer panel: 2.5h, Nav: 30min)

## 🔗 Dependencies
- Blocked by **Team Member 1** for API routes (use `console.log` mock in the interim)
- Coordinate with **Team Member 2** on the post-approval experience (badge award animation)
- Make sure the trainer nav section you edit matches **Team Member 4**'s notification badge work
