import { describe, expect, it } from 'vitest'
import { normalizeWord } from './roomCode'

describe('word cloud aggregation', () => {
  it('stacks duplicate normalized phrases', () => {
    const entries = [
      { text: 'Fun', uid: 'a', at: 1 },
      { text: 'fun', uid: 'a', at: 2 },
      { text: 'Hard', uid: 'a', at: 3 },
    ]
    const map = new Map<string, number>()
    for (const e of entries) {
      const norm = normalizeWord(e.text)
      map.set(norm, (map.get(norm) ?? 0) + 1)
    }
    expect(map.get('fun')).toBe(2)
    expect(map.get('hard')).toBe(1)
  })
})

describe('vote totals', () => {
  it('uses zero total when no votes', () => {
    const counts = [0, 0, 0]
    const total = counts.reduce((a, b) => a + b, 0)
    expect(total).toBe(0)
    const pct = total === 0 ? 0 : Math.round((counts[0] / total) * 100)
    expect(pct).toBe(0)
  })
})
