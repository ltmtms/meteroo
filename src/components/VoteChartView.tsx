import { useMemo } from 'react'
import type { VoteRecord } from '../types'

interface Props {
  options: string[]
  votes: Record<string, VoteRecord>
  compact?: boolean
}

export function VoteChartView({ options, votes, compact }: Props) {
  const counts = useMemo(() => {
    const c = options.map(() => 0)
    for (const v of Object.values(votes)) {
      if (v.optionIndex >= 0 && v.optionIndex < c.length) c[v.optionIndex] += 1
    }
    return c
  }, [options, votes])

  const total = counts.reduce((a, b) => a + b, 0) || 1
  const max = Math.max(1, ...counts)

  if (options.length === 0) {
    return <p className="empty-state">No options configured</p>
  }

  return (
    <div className={`vote-chart${compact ? ' vote-chart--compact' : ''}`} aria-live="polite">
      {options.map((label, i) => {
        const pct = Math.round((counts[i] / total) * 100)
        const widthPct = (counts[i] / max) * 100
        return (
          <div key={i} className="vote-row">
            <div className="vote-label-row">
              <span className="vote-label">{label}</span>
              <span className="vote-stats">
                {counts[i]} · {pct}%
              </span>
            </div>
            <div className="vote-bar-track">
              <div
                className="vote-bar-fill"
                style={{ width: `${widthPct}%`, transition: 'width 0.45s ease' }}
              />
            </div>
          </div>
        )
      })}
      <p className="vote-total">{total} vote{total === 1 ? '' : 's'} · 票</p>
    </div>
  )
}
