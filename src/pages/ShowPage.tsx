import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlideResults } from '../components/Layout'
import { normalizeRoomCode } from '../lib/roomCode'
import {
  joinSessionExists,
  subscribeSession,
  subscribeShortAnswers,
  subscribeVotes,
  subscribeWords,
} from '../lib/sessionApi'
import type { SessionData, ShortAnswer, VoteRecord, WordEntry } from '../types'

export function ShowPage() {
  const [params] = useSearchParams()
  const [codeInput, setCodeInput] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [words, setWords] = useState<Record<string, WordEntry>>({})
  const [shorts, setShorts] = useState<Record<string, ShortAnswer>>({})
  const [votes, setVotes] = useState<Record<string, VoteRecord>>({})

  useEffect(() => {
    const fromUrl = params.get('code')
    if (fromUrl) {
      const c = normalizeRoomCode(fromUrl)
      setCodeInput(c)
      setCode(c)
    }
  }, [params])

  useEffect(() => {
    if (!code) return
    return subscribeSession(code, setSession)
  }, [code])

  const slideIndex = session?.currentSlideIndex ?? 0
  const slide = session?.slides[slideIndex]

  useEffect(() => {
    if (!code || !session) return
    const i = session.currentSlideIndex
    const u1 = subscribeWords(code, i, setWords)
    const u2 = subscribeShortAnswers(code, i, setShorts)
    const u3 = subscribeVotes(code, i, setVotes)
    return () => {
      u1()
      u2()
      u3()
    }
  }, [code, session?.currentSlideIndex, session])

  const connect = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const c = normalizeRoomCode(codeInput)
    if (c.length < 4) {
      setError('Enter room code')
      return
    }
    const ok = await joinSessionExists(c)
    if (!ok) {
      setError('Room not found')
      return
    }
    setCode(c)
  }

  if (!code) {
    return (
      <div className="show-setup">
        <form className="show-setup-form" onSubmit={connect}>
          <h1>meteroo display</h1>
          <input
            className="input input-lg"
            value={codeInput}
            onChange={(e) => setCodeInput(normalizeRoomCode(e.target.value))}
            placeholder="Room code"
            maxLength={6}
          />
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-lg">
            Connect
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="show-screen">
      <div className="show-top">
        <span className="show-room">{code}</span>
      </div>
      {!session || !slide ? (
        <p className="empty-state light">Waiting for presenter…</p>
      ) : (
        <SlideResults
          type={slide.type}
          prompt={slide.prompt}
          options={slide.options}
          words={words}
          shorts={shorts}
          votes={votes}
          shuffleShort={slide.type === 'short'}
        />
      )}
    </div>
  )
}
