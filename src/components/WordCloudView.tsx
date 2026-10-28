import { useMemo } from 'react'
import { normalizeWord } from '../lib/roomCode'
import type { WordEntry } from '../types'

interface CloudWord {
  text: string
  count: number
  weight: number
}

const COLORS = [
  '#e07a5f',
  '#f2cc8f',
  '#81b29a',
  '#3d405b',
  '#f4a261',
  '#e9c46a',
  '#2a9d8f',
  '#264653',
  '#bc6c25',
  '#606c38',
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function WordCloudView({ entries }: { entries: Record<string, WordEntry> }) {
  const words = useMemo(() => {
    const map = new Map<string, { display: string; count: number }>()
    for (const e of Object.values(entries)) {
      const norm = normalizeWord(e.text)
      if (!norm) continue
      const existing = map.get(norm)
      if (existing) {
        existing.count += 1
        if (e.text.trim().length > existing.display.length) existing.display = e.text.trim()
      } else {
        map.set(norm, { display: e.text.trim(), count: 1 })
      }
    }
    const list = [...map.values()]
    const max = Math.max(1, ...list.map((w) => w.count))
    const cloud: CloudWord[] = list.map((w) => ({
      text: w.display,
      count: w.count,
      weight: 0.65 + (w.count / max) * 1.35,
    }))
    cloud.sort((a, b) => b.count - a.count)
    return cloud
  }, [entries])

  if (words.length === 0) {
    return <p className="empty-state">Waiting for words… 等待詞語</p>
  }

  return (
    <div className="word-cloud" aria-live="polite">
      {words.map((w) => {
        const h = hashString(w.text)
        const color = COLORS[h % COLORS.length]
        const rotate = (h % 7) - 3
        return (
          <span
            key={w.text}
            className="word-cloud-item"
            style={{
              fontSize: `${w.weight}rem`,
              color,
              transform: `rotate(${rotate}deg)`,
              animationDelay: `${(h % 500) / 1000}s`,
            }}
            title={`${w.count}×`}
          >
            {w.text}
          </span>
        )
      })}
    </div>
  )
}
