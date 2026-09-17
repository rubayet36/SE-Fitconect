type RankBadgeProps = {
  rank: number
}

export function RankBadge({ rank }: RankBadgeProps) {
  const config: Record<number, { emoji: string; class: string; label: string }> = {
    1: { emoji: '🥇', class: 'rank-gold',   label: '#1' },
    2: { emoji: '🥈', class: 'rank-silver', label: '#2' },
    3: { emoji: '🥉', class: 'rank-bronze', label: '#3' },
  }

  const item = config[rank] ?? {
    emoji: '',
    class: 'rank-default',
    label: `#${rank}`,
  }

  return (
    <span
      className={`rank-badge ${item.class}`}
      aria-label={`Rank ${item.label}`}
    >
      {item.emoji && <span aria-hidden="true">{item.emoji}</span>}
      <span>{item.label}</span>
    </span>
  )
}
