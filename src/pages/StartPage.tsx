import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/Layout'
import { normalizeRoomCode } from '../lib/roomCode'
import {
  getParticipantUid,
  joinSessionExists,
  storeLocalVote,
  submitShortAnswer,
  submitVote,
  submitWord,
  subscribeSession,
  subscribeVotes,
  subscribeWords,
} from '../lib/sessionApi'
import { MAX_WORDS_PER_PARTICIPANT_PER_SLIDE } from '../types'
import type { SessionData, VoteRecord } from '../types'

export function StartPage() {
  const [params] = useSearchParams()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [joined, setJoined] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [votes, setVotes] = useState<Record<string, VoteRecord>>({})
  const [myVote, setMyVote] = useState<number | null>(null)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    const fromUrl = params.get('code')
    if (fromUrl) setCode(normalizeRoomCode(fromUrl))
    const savedNick = localStorage.getItem('meteroo-nickname')
    if (savedNick) setNickname(savedNick)
    const savedCode = localStorage.getItem('meteroo-participant-code')
    if (!fromUrl && savedCode) setCode(savedCode)
  }, [params])

  useEffect(() => {
    if (!joined || !code) return
    return subscribeSession(code, setSession)
  }, [joined, code])

  const slide = session?.slides[session.currentSlideIndex]
  const slideIndex = session?.currentSlideIndex ?? 0

  useEffect(() => {
    if (!joined || !code || !slide || slide.type !== 'vote') return
    return subscribeVotes(code, slideIndex, setVotes)
  }, [joined, code, slide?.type, slideIndex, slide])

  useEffect(() => {
    if (!joined || !code || slide?.type !== 'wordcloud') return
    return subscribeWords(code, slideIndex, (entries) => {
      void (async () => {
        const uid = await getParticipantUid()
        const n = Object.values(entries).filter((e) => e.uid === uid).length
        setWordCount(n)
      })()
    })
  }, [joined, code, slide?.type, slideIndex, slide])

  useEffect(() => {
    if (slideIndex !== undefined) {
      setText('')
      setWordCount(0)
      setError(null)
    }
  }, [slideIndex, slide?.type])

  useEffect(() => {
    if (!joined || !code || slide?.type !== 'vote') return
    void (async () => {
      const uid = await getParticipantUid()
      const v = votes[uid]
      setMyVote(v?.optionIndex ?? null)
    })()
  }, [votes, joined, code, slide?.type])

  const join = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    const normalized = normalizeRoomCode(code)
    if (normalized.length < 4) {
      setError('Enter the room code from your teacher')
      return
    }
    const exists = await joinSessionExists(normalized)
    if (!exists) {
      setError('Room not found')
      return
    }
    setCode(normalized)
    localStorage.setItem('meteroo-participant-code', normalized)
    if (nickname.trim()) localStorage.setItem('meteroo-nickname', nickname.trim())
    setJoined(true)
  }

  const sendText = async () => {
    if (!slide || !text.trim()) return
    setSending(true)
    setError(null)
    try {
      const nick = nickname.trim() || undefined
      if (slide.type === 'wordcloud') {
        await submitWord(code, slideIndex, text.trim(), nick)
      } else if (slide.type === 'short') {
        await submitShortAnswer(code, slideIndex, text.trim(), nick)
      }
      setText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit')
    } finally {
      setSending(false)
    }
  }

  const castVote = async (optionIndex: number) => {
    if (!slide || slide.type !== 'vote') return
    setSending(true)
    try {
      await submitVote(code, slideIndex, optionIndex)
      storeLocalVote(code, slideIndex, optionIndex)
      setMyVote(optionIndex)
    } finally {
      setSending(false)
    }
  }

  const voteOptions = useMemo(() => slide?.options?.filter(Boolean) ?? [], [slide])

  if (!joined) {
    return (
      <AppShell title="Join · 參與">
        <form className="panel narrow join-form" onSubmit={join}>
          <h2>Join session</h2>
          <label className="field">
            Room code
            <input
              className="input input-lg"
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              placeholder="e.g. 7K3NP"
              maxLength={6}
              autoComplete="off"
            />
          </label>
          <label className="field">
            Nickname (optional) · 暱稱
            <input
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Alex"
              maxLength={24}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block btn-lg">
            Join
          </button>
        </form>
      </AppShell>
    )
  }

  return (
    <AppShell title="Join · 參與">
      <div className="participant">
        <p className="room-pill">Room {code}</p>
        {!session ? (
          <p className="empty-state">Connecting…</p>
        ) : !slide ? (
          <p className="empty-state">Waiting for presenter…</p>
        ) : (
          <>
            <h2 className="participant-prompt">{slide.prompt}</h2>
            {slide.type === 'vote' ? (
              <div className="vote-choices">
                {voteOptions.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`vote-choice${myVote === i ? ' selected' : ''}`}
                    disabled={sending}
                    onClick={() => castVote(i)}
                  >
                    {label}
                  </button>
                ))}
                <p className="muted small center">Tap to vote · tap again to change · 可改票</p>
              </div>
            ) : (
              <>
                <textarea
                  className="input textarea"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={slide.type === 'wordcloud' ? 'Type a word or phrase…' : 'Your answer…'}
                />
                {slide.type === 'wordcloud' ? (
                  <p className="muted small center">
                    Send another word · 再送一個詞 ({wordCount}/{MAX_WORDS_PER_PARTICIPANT_PER_SLIDE})
                  </p>
                ) : null}
                {error ? <p className="error">{error}</p> : null}
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={sending || !text.trim() || (slide.type === 'wordcloud' && wordCount >= MAX_WORDS_PER_PARTICIPANT_PER_SLIDE)}
                  onClick={sendText}
                >
                  Submit
                </button>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
