'use client'

export type StreakTrackerProps = {
  streakDays: number
  lastActivityDate: string | null
}

export function StreakTracker({ streakDays, lastActivityDate }: StreakTrackerProps) {
  // Generate last 7 day labels
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      fullDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
    }
  })

  const lastDate = lastActivityDate ? new Date(lastActivityDate) : null
  const today = new Date()
  const daysSinceActivity = lastDate
    ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Mark active days: backwards from last activity up to streak count
  const activeDays = new Set<string>()
  if (lastDate && streakDays > 0) {
    for (let i = 0; i < streakDays && i < 7; i++) {
      const d = new Date(lastDate)
      d.setDate(d.getDate() - i)
      activeDays.add(d.toISOString().split('T')[0])
    }
  }

  return (
    <div className="streak-tracker">
      <div className="streak-header justify-between">
        <div className="flex items-center gap-2">
          <span className="streak-flame">{streakDays > 0 ? '🔥' : '💤'}</span>
          <span className="streak-count">{streakDays} Day{streakDays === 1 ? '' : 's'} Streak</span>
        </div>
        {streakDays > 0 && daysSinceActivity <= 1 && (
          <span className="streak-status active">Active</span>
        )}
      </div>
      <div className="streak-days">
        {days.map((day) => {
          const isDone = activeDays.has(day.date)
          return (
            <div
              key={day.date}
              className={`streak-day ${isDone ? 'completed' : 'missed'}`}
              title={`${day.fullDay}: ${isDone ? 'Workout Completed' : 'Rest/Pending'}`}
            >
              <div className="day-dot flex items-center justify-center text-[10px]">
                {isDone ? '✓' : ''}
              </div>
              <span className="day-label">{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
