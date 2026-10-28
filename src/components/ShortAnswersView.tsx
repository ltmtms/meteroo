import { useMemo } from 'react'
import type { ShortAnswer } from '../types'

interface Props {
  entries: Record<string, ShortAnswer>
  shuffle?: boolean
}

export function ShortAnswersView({ entries, shuffle = false }: Props) {
  const list = useMemo(() => {
    const arr = Object.values(entries).sort((a, b) => b.at - a.at)
    if (shuffle) {
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    }
    return arr
  }, [entries, shuffle])

  if (list.length === 0) {
    return <p className="empty-state">Waiting for answers… 等待回答</p>
  }

  return (
    <ul className="answer-wall" aria-live="polite">
      {list.map((a, i) => (
        <li key={`${a.at}-${i}`} className="answer-card">
          <p className="answer-text">{a.text}</p>
          {a.nickname ? <span className="answer-meta">{a.nickname}</span> : null}
        </li>
      ))}
    </ul>
  )
}
