'use client'

type StreakTrackerProps = {
  streakDays: number
  lastActivityDate: string | null // ISO date string
}

export function StreakTracker({ streakDays, lastActivityDate }: StreakTrackerProps) {
  // Generate last 7 day labels (oldest → newest, left → right)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
    }
  })

  const lastDate = lastActivityDate ? new Date(lastActivityDate) : null
  const today = new Date()
  const daysSinceActivity = lastDate
    ? Math.floor((today.getTime() - lastDate.getTime()) / 86400000)
    : 999

  // Mark active days: the last `streakDays` consecutive days up to lastActivityDate
  const activeDays = new Set<string>()
  if (lastDate) {
    for (let i = 0; i < streakDays && i < 7; i++) {
      const d = new Date(lastDate)
      d.setDate(d.getDate() - i)
      activeDays.add(d.toISOString().split('T')[0])
    }
  }

  const isActive = daysSinceActivity <= 1
  const streakLabel = streakDays === 1 ? '1-Day Streak' : `${streakDays}-Day Streak`

  return (
    <div className="streak-tracker">
      <div className="streak-header">
        <span className="streak-flame" aria-hidden="true">
          {streakDays > 0 ? '🔥' : '💤'}
        </span>
        <span className="streak-count">{streakLabel}</span>
        {isActive && (
          <span className="streak-status active" aria-label="Streak is active">
            Active
          </span>
        )}
      </div>

      <div className="streak-days" role="list" aria-label="Last 7 days activity">
        {days.map((day, index) => {
          const completed = activeDays.has(day.date)
          return (
            <div
              key={day.date}
              className={`streak-day ${completed ? 'completed' : 'missed'}`}
              role="listitem"
              aria-label={`${day.label}: ${completed ? 'completed' : 'missed'}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="day-dot" />
              <span className="day-label">{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
