'use client'
import { useEffect, useState } from 'react'

type PointsToastProps = {
  points: number
  exerciseName: string
  visible: boolean
  onDismiss: () => void
}

export function PointsToast({ points, exerciseName, visible, onDismiss }: PointsToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsExiting(false)
      const dismissTimer = setTimeout(() => {
        setIsExiting(true)
        // Give the exit animation time to play before calling onDismiss
        setTimeout(onDismiss, 400)
      }, 3600)
      return () => clearTimeout(dismissTimer)
    }
  }, [visible, onDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(onDismiss, 400)
  }

  if (!visible) return null

  return (
    <div
      className={`points-toast ${isExiting ? 'points-toast--exit' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">⚡</div>
      <div className="toast-content">
        <div className="toast-title">Points Awarded!</div>
        <div className="toast-body">
          <strong>+{points} pts</strong> for {exerciseName}
        </div>
      </div>
      <button className="toast-close" onClick={handleDismiss} aria-label="Close">
        ✕
      </button>
    </div>
  )
}
