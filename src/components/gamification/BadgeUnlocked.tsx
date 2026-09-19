'use client'
import { useEffect, useState } from 'react'

type BadgeUnlockedProps = {
  badge: {
    name: string
    description: string
    icon_emoji: string
  } | null
  onClose: () => void
}

export function BadgeUnlocked({ badge, onClose }: BadgeUnlockedProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (badge) {
      setIsExiting(false)
      // Auto-close after 6s — play exit animation first, then call onClose
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 350)
      }, 5650)
      return () => clearTimeout(timer)
    }
  }, [badge, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 350)
  }

  if (!badge) return null

  return (
    <div
      className={`badge-overlay ${isExiting ? 'badge-overlay--exit' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Badge Unlocked: ${badge.name}`}
    >
      <div
        className={`badge-modal ${isExiting ? 'badge-modal--exit' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="badge-sparkles">✨ ✨ ✨</div>
        <div className="badge-emoji-display">{badge.icon_emoji}</div>
        <h2 className="badge-title">Badge Unlocked!</h2>
        <h3 className="badge-name">{badge.name}</h3>
        <p className="badge-description">{badge.description}</p>
        <button
          className="badge-dismiss-btn"
          onClick={handleClose}
          autoFocus
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  )
}
