'use client'

export type RankBadgeProps = {
  rank: number
  className?: string
}

export function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const config: Record<number, { emoji: string; class: string; label: string }> = {
    1: { emoji: '🥇', class: 'rank-gold', label: '#1' },
    2: { emoji: '🥈', class: 'rank-silver', label: '#2' },
    3: { emoji: '🥉', class: 'rank-bronze', label: '#3' },
  }
  const item = config[rank] ?? { emoji: '', class: 'rank-default', label: `#${rank}` }

  return (
    <span className={`rank-badge ${item.class} ${className}`}>
      {item.emoji && <span className="leading-none">{item.emoji}</span>}
      <span className="font-mono text-xs">{item.label}</span>
    </span>
  )
}
