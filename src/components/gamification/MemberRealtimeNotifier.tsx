'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PointsToast } from './PointsToast'

export function MemberRealtimeNotifier({ userId }: { userId: string }) {
  const [toastData, setToastData] = useState<{
    points: number
    exerciseName: string
    visible: boolean
  }>({
    points: 0,
    exerciseName: '',
    visible: false,
  })

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`exercise-log-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exercise_logs',
          filter: `member_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status === 'approved') {
            setToastData({
              points: payload.new.points_awarded || 10,
              exerciseName: payload.new.exercise_name || 'Workout',
              visible: true,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <PointsToast
      points={toastData.points}
      exerciseName={toastData.exerciseName}
      visible={toastData.visible}
      onDismiss={() => setToastData((prev) => ({ ...prev, visible: false }))}
    />
  )
}
