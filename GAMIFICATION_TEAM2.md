# 🥇 Gamification Feature — Team Member 2
## Role: Member Dashboard — Leaderboard & Points UI Lead

---

## 📋 Overview

You are responsible for building the **visual gamification experience inside the Member Dashboard**. Members will see their points, rank, streak, badges, and a live leaderboard. This is the most user-facing part of the feature — it needs to look stunning and feel rewarding.

> ⚠️ **Dependency**: Team Member 1 must complete the `/api/gamification/leaderboard` route before you can integrate live data. Build with **mock data first**, then swap in real API calls.

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
git checkout -b feature/gamification-leaderboard-ui
```
> This is **your branch name**. Only Team Member 2 uses this branch.

### Step 4 — Work on your tasks, then commit regularly
```bash
# After building the leaderboard page:
git add .
git commit -m "feat: add member leaderboard page with mock data"

# After adding the points widget to dashboard:
git add .
git commit -m "feat: add points widget to member dashboard"

# After wiring real API:
git add .
git commit -m "feat: connect leaderboard to live gamification API"
```

### Step 5 — Push your branch to GitHub
```bash
git push origin feature/gamification-leaderboard-ui
```

### Step 6 — Open a Pull Request when done
1. Go to the GitHub repository
2. Click **"Compare & pull request"** for your branch
3. Set the base branch to `main`
4. Title: `[Team 2] Gamification Leaderboard & Points UI`
5. Assign your teammates as reviewers
6. **Do not merge** — wait for at least 1 teammate to review

### ⚡ Branch Naming Convention
| Team Member | Branch Name |
|---|---|
| Member 1 | `feature/gamification-database-api` |
| **Member 2** (you) | `feature/gamification-leaderboard-ui` |
| Member 3 | `feature/gamification-log-approval` |
| Member 4 | `feature/gamification-badges-animations` |

---

## 🏗️ Task 1 — Leaderboard Page

Create: `src/app/member/leaderboard/page.tsx`

### What to Build

A full leaderboard page accessible from the member dashboard sidebar/nav. It should display:

- **Top 20 members** ranked by total points
- A **gold/silver/bronze** crown or medal for positions 1–3
- **Your Rank** highlighted (current user's row glows/highlighted even if outside top 20)
- Toggle between **All-Time** and **This Week** leaderboard views
- Each row shows: Rank, Avatar, Full Name, Total Points, Streak Days

### UI Design Guidelines

- Dark card aesthetic matching the existing member dashboard (`bg-[#0f0f0f]`, glassmorphism cards)
- Animated rank numbers with a subtle entrance animation (use `@keyframes slideIn`)
- Top 3 rows get a shimmering gold/silver/bronze gradient background
- A pulsing green dot next to the current user's row
- Points displayed with a ⚡ icon

### Sample Component Structure

```tsx
// src/app/member/leaderboard/page.tsx
'use client'
import { useState, useEffect } from 'react'

type LeaderboardEntry = {
  rank: number
  member_id: string
  full_name: string
  avatar_url: string | null
  total_points: number
  weekly_points: number
  streak_days: number
}

// Mock data for development (replace with API call after Team Member 1 is done)
const MOCK_DATA: LeaderboardEntry[] = [
  { rank: 1, member_id: 'a', full_name: 'Ahmed Khan',    avatar_url: null, total_points: 980, weekly_points: 120, streak_days: 14 },
  { rank: 2, member_id: 'b', full_name: 'Sara Hossain',  avatar_url: null, total_points: 875, weekly_points: 95,  streak_days: 9  },
  { rank: 3, member_id: 'c', full_name: 'Rafi Islam',    avatar_url: null, total_points: 740, weekly_points: 80,  streak_days: 7  },
  // ... add more mock rows
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'alltime' | 'weekly'>('alltime')
  const [entries, setEntries] = useState<LeaderboardEntry[]>(MOCK_DATA)

  // TODO (after Team Member 1): Replace mock with real fetch
  // useEffect(() => {
  //   fetch('/api/gamification/leaderboard')
  //     .then(r => r.json())
  //     .then(res => setEntries(res.data.map((e, i) => ({ ...e, rank: i + 1 }))))
  // }, [tab])

  return (
    <div className="leaderboard-page">
      {/* Tab toggle, ranking list, current-user highlight */}
    </div>
  )
}
```

### CSS to Add (in `globals.css` or a module)

```css
.rank-gold   { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
.rank-silver { background: linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%); }
.rank-bronze { background: linear-gradient(135deg, #f093fb 0%, #c97b4b 100%); }
.leaderboard-row { transition: transform 0.2s ease; }
.leaderboard-row:hover { transform: translateX(4px); }
.current-user-row { box-shadow: 0 0 0 2px #22c55e; animation: pulse 2s infinite; }
```

---

## 🏅 Task 2 — Points & Badges Widget for Member Dashboard

Edit: `src/app/member/dashboard/page.tsx`

Add a **"My Points" card** to the existing member dashboard. This card should show:

- Total points with a big animated number counter
- Current streak (e.g., "🔥 7-day streak!")
- Current rank (e.g., "#4 on the leaderboard")
- Earned badges displayed as emoji pills
- A **"View Full Leaderboard →"** link

### Widget Mock (Add to existing dashboard grid)

```tsx
// Add this component to the dashboard
function PointsWidget({ totalPoints, streak, rank, badges }: {
  totalPoints: number
  streak: number
  rank: number
  badges: { icon_emoji: string; name: string }[]
}) {
  return (
    <div className="points-widget glass-card">
      <h3>⚡ My Points</h3>
      <div className="points-display">
        <span className="points-number">{totalPoints.toLocaleString()}</span>
        <span className="points-label">pts</span>
      </div>
      <div className="points-meta">
        <span>🔥 {streak}-day streak</span>
        <span>🏆 Rank #{rank}</span>
      </div>
      <div className="badges-row">
        {badges.map(b => (
          <span key={b.name} className="badge-pill" title={b.name}>
            {b.icon_emoji}
          </span>
        ))}
      </div>
      <a href="/member/leaderboard" className="leaderboard-link">
        View Leaderboard →
      </a>
    </div>
  )
}
```

### Fetch Member Points in Dashboard

```typescript
// Add this data fetching to the dashboard page (server component)
const { data: myPoints } = await supabase
  .from('member_points')
  .select('total_points, streak_days')
  .eq('member_id', user.id)
  .single()

const { data: myBadges } = await supabase
  .from('member_badges')
  .select('badges(name, icon_emoji)')
  .eq('member_id', user.id)
```

---

## 📊 Task 3 — Exercise Log History Page

Create: `src/app/member/activity-log/page.tsx`

Members should be able to see all their submitted exercise logs and their status. This is useful for motivation and transparency.

### What to Display

| Column | Description |
|---|---|
| Exercise Name | e.g., "Bench Press" |
| Date | Submitted date |
| Sets × Reps | e.g., "3 × 12" |
| Status | Pending 🕐 / Approved ✅ / Rejected ❌ |
| Points Earned | Shows 0 if pending/rejected |

### Data Fetch (Supabase Client)

```typescript
const { data: logs } = await supabase
  .from('exercise_logs')
  .select('*')
  .eq('member_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 🧭 Task 4 — Add Navigation Links

Edit: `src/app/member/layout.tsx`

Add two new nav entries to the existing member sidebar/navbar:

1. **"🏆 Leaderboard"** → `/member/leaderboard`
2. **"📋 My Activity"** → `/member/activity-log`

Look at how existing links like "My Plan" and "Diet" are added in the layout, and follow the same pattern.

---

## ✅ Deliverables Checklist

- [ ] `/member/leaderboard/page.tsx` — working with mock data, beautiful UI
- [ ] Leaderboard shows gold/silver/bronze styling for top 3
- [ ] Current user's row is highlighted
- [ ] All-Time vs Weekly tab toggle works
- [ ] `PointsWidget` added to member dashboard
- [ ] `/member/activity-log/page.tsx` — exercise log history with status badges
- [ ] Navigation links added to member layout
- [ ] All pages are responsive (mobile + desktop)
- [ ] After Team Member 1 finishes: Replace mock data with real API fetch

---

## 📅 Estimated Time
**6–8 hours** (Leaderboard UI: 3h, Dashboard widget: 1.5h, Activity log: 1.5h, Nav: 30min)

## 🔗 Dependencies
- Blocked by **Team Member 1** for live data (build UI with mock data first)
- Coordinate with **Team Member 1** on the leaderboard API response shape
- Share the badge/points data structure with **Team Member 4** (animations)
