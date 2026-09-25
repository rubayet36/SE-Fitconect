'use client'

import { useEffect } from 'react'

export type PointsToastProps = {
  points: number
  exerciseName: string
  visible: boolean
  onDismiss: () => void
}

export function PointsToast({ points, exerciseName, visible, onDismiss }: PointsToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div className="points-toast" role="alert" aria-live="polite">
      <div className="toast-icon">⚡</div>
      <div className="toast-content">
        <div className="toast-title">Points Awarded!</div>
        <div className="toast-body">
          <strong className="text-green-400">+{points} pts</strong> for {exerciseName}
        </div>
      </div>
      <button className="toast-close" onClick={onDismiss} aria-label="Close">
        ✕
      </button>
    </div>
  )
}
