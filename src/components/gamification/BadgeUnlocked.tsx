'use client'

import { useEffect } from 'react'

export type BadgeUnlockedProps = {
  badge: {
    name: string
    description: string
    icon_emoji: string
  } | null
  onClose: () => void
}

export function BadgeUnlocked({ badge, onClose }: BadgeUnlockedProps) {
  useEffect(() => {
    if (badge) {
      // Auto close after 7 seconds
      const timer = setTimeout(onClose, 7000)
      return () => clearTimeout(timer)
    }
  }, [badge, onClose])

  if (!badge) return null

  return (
    <div className="badge-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="badge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="badge-sparkles">✨ ✨ ✨</div>
        <div className="badge-emoji-display">{badge.icon_emoji}</div>
        <h2 className="badge-title">Badge Unlocked!</h2>
        <h3 className="badge-name">{badge.name}</h3>
        <p className="badge-description">{badge.description}</p>
        <button className="badge-dismiss-btn" onClick={onClose}>
          Awesome! 🎉
        </button>
      </div>
    </div>
  )
}
