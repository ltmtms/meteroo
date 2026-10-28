import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, SlideResults } from '../components/Layout'
import { ensureAnonymousAuth, isFirebaseConfigured } from '../lib/firebase'
import { generateRoomCode, normalizeRoomCode } from '../lib/roomCode'
import {
  createSession,
  joinSessionExists,
  resetSlideResponses,
  setCurrentSlide,
  setSlides,
  subscribeSession,
  subscribeShortAnswers,
  subscribeVotes,
  subscribeWords,
} from '../lib/sessionApi'
import { sanitizeSlides } from '../lib/sanitizeFirebase'
import type { ShortAnswer, Slide, SlideType, VoteRecord, WordEntry } from '../types'

const SLIDE_PROMPT_PLACEHOLDER = 'Your question here · 在此輸入問題'

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: 'wordcloud', label: 'Word cloud' },
  { value: 'short', label: 'Short answer' },
  { value: 'vote', label: 'Live vote' },
]

function newSlide(type: SlideType = 'wordcloud'): Slide {
  const base = {
    id: crypto.randomUUID(),
    type,
    prompt: '',
  }
  if (type === 'vote') {
    return { ...base, options: ['Option A', 'Option B'] }
  }
  return base
}

export function AdminPage() {
  const [roomCode, setRoomCode] = useState('')
  const [connected, setConnected] = useState(false)
  const [session, setSession] = useState<import('../types').SessionData | null>(null)
  const [localSlides, setLocalSlides] = useState<Slide[]>([newSlide()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idx = session?.currentSlideIndex ?? 0
  const currentSlide = session?.slides[idx]

  const [words, setWords] = useState<Record<string, WordEntry>>({})
  const [shorts, setShorts] = useState<Record<string, ShortAnswer>>({})
  const [votes, setVotes] = useState<Record<string, VoteRecord>>({})
  const [editorIndex, setEditorIndex] = useState(0)

  useEffect(() => {
    if (!connected || !roomCode) return
    return subscribeSession(roomCode, setSession)
  }, [connected, roomCode])

  useEffect(() => {
    if (!connected || !roomCode || !session) return
    const i = session.currentSlideIndex
    const u1 = subscribeWords(roomCode, i, setWords)
    const u2 = subscribeShortAnswers(roomCode, i, setShorts)
    const u3 = subscribeVotes(roomCode, i, setVotes)
    return () => {
      u1()
      u2()
      u3()
    }
  }, [connected, roomCode, session?.currentSlideIndex, session])

  const createRoom = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      const code = generateRoomCode(5)
      let adminUid = 'demo-admin'
      if (isFirebaseConfigured()) adminUid = await ensureAnonymousAuth()
      await createSession(code, adminUid, localSlides)
      setRoomCode(code)
      setConnected(true)
      localStorage.setItem('meteroo-admin-code', code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create session')
    } finally {
      setBusy(false)
    }
  }, [localSlides])

  const joinRoom = useCallback(async () => {
    setError(null)
    const code = normalizeRoomCode(roomCode)
    if (code.length < 4) {
      setError('Enter a valid room code (4+ characters)')
      return
    }
    setBusy(true)
    try {
      const exists = await joinSessionExists(code)
      if (!exists) {
        setError('Room not found. Create a new session or check the code.')
        return
      }
      setRoomCode(code)
      setConnected(true)
      localStorage.setItem('meteroo-admin-code', code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join')
    } finally {
      setBusy(false)
    }
  }, [roomCode])

  useEffect(() => {
    const saved = localStorage.getItem('meteroo-admin-code')
    if (saved) setRoomCode(saved)
  }, [])

  const saveSlides = async () => {
    if (!roomCode) return
    setBusy(true)
    try {
      const sanitized = sanitizeSlides(localSlides)
      await setSlides(roomCode, sanitized)
      setLocalSlides(sanitized)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (connected && session?.slides) setLocalSlides(session.slides)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync slides when room is joined
  }, [connected, roomCode])

  useEffect(() => {
    setEditorIndex(idx)
  }, [idx])

  const goSlide = async (next: number) => {
    if (!session || !roomCode) return
    const clamped = Math.max(0, Math.min(next, session.slides.length - 1))
    await setCurrentSlide(roomCode, clamped)
  }

  const jumpToSlide = async (i: number) => {
    const target = Math.max(0, Math.min(i, localSlides.length - 1))
    setEditorIndex(target)
    if (session && target < session.slides.length) {
      await goSlide(target)
    }
  }

  const showLinks = useMemo(() => {
    const q = roomCode ? `?code=${encodeURIComponent(roomCode)}` : ''
    return { start: `/start${q}`, show: `/show${q}` }
  }, [roomCode])

  if (!connected) {
    return (
      <AppShell title="Presenter · 主持">
        <div className="panel narrow">
          <h2>Start presenting</h2>
          <p className="muted">Build slides locally, then create a room or rejoin with a code.</p>
          <SlideEditorList slides={localSlides} onChange={setLocalSlides} />
          <div className="stack gap">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={createRoom}>
              Create new room
            </button>
            <div className="join-row">
              <input
                className="input"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(normalizeRoomCode(e.target.value))}
                maxLength={6}
              />
              <button type="button" className="btn" disabled={busy} onClick={joinRoom}>
                Rejoin
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Presenter · 主持">
      <div className="admin-grid">
        <aside className="panel admin-side">
          <div className="room-badge">
            Room <strong>{roomCode}</strong>
          </div>
          <p className="muted small">
            Share code with class ·{' '}
            <Link to={showLinks.start} target="_blank" rel="noreferrer">
              Join link
            </Link>{' '}
            ·{' '}
            <Link to={showLinks.show} target="_blank" rel="noreferrer">
              Display
            </Link>
          </p>

          <SlideEditorList
            slides={localSlides}
            onChange={setLocalSlides}
            compact
            liveSlideIndex={idx}
            editorIndex={editorIndex}
            onJumpToSlide={(i) => void jumpToSlide(i)}
            savedSlideCount={session?.slides.length ?? 0}
          />
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={saveSlides}>
            Save slides to room
          </button>

          <div className="control-bar">
            <button
              type="button"
              className="btn"
              disabled={!session || idx <= 0}
              onClick={() => goSlide(idx - 1)}
            >
              ← Prev
            </button>
            <span className="slide-indicator">
              {idx + 1} / {session?.slides.length ?? 0}
            </span>
            <button
              type="button"
              className="btn"
              disabled={!session || idx >= (session?.slides.length ?? 1) - 1}
              onClick={() => goSlide(idx + 1)}
            >
              Next →
            </button>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => resetSlideResponses(roomCode, idx)}
          >
            Reset responses (this slide)
          </button>
          <Link className="btn btn-primary" to={showLinks.show} target="_blank" rel="noreferrer">
            Open display fullscreen
          </Link>
        </aside>

        <div className="panel admin-preview">
          <p className="eyebrow">Live preview</p>
          {currentSlide ? (
            <SlideResults
              type={currentSlide.type}
              prompt={currentSlide.prompt}
              options={currentSlide.options}
              words={words}
              shorts={shorts}
              votes={votes}
            />
          ) : (
            <p className="empty-state">No slide selected</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function SlideEditorList({
  slides,
  onChange,
  compact,
  liveSlideIndex,
  editorIndex,
  onJumpToSlide,
  savedSlideCount,
}: {
  slides: Slide[]
  onChange: (s: Slide[]) => void
  compact?: boolean
  liveSlideIndex?: number
  editorIndex?: number
  onJumpToSlide?: (index: number) => void
  savedSlideCount?: number
}) {
  const update = (i: number, patch: Partial<Slide>) => {
    const next = slides.map((s, j) => (j === i ? { ...s, ...patch } : s))
    onChange(next)
  }

  const editIdx = compact ? (editorIndex ?? 0) : -1
  const slideToEdit = compact ? slides[editIdx] : null

  return (
    <div className={`slide-editor-list${compact ? ' compact' : ''}`}>
      {!compact ? <h3>Slides</h3> : null}
      {compact && onJumpToSlide ? (
        <div className="slide-tabs" role="tablist" aria-label="Slides">
          {slides.map((slide, i) => {
            const isLive = i === liveSlideIndex
            const isEditing = i === editIdx
            const unsaved = savedSlideCount !== undefined && i >= savedSlideCount
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isEditing}
                aria-current={isLive ? 'step' : undefined}
                className={`slide-tab${isLive ? ' slide-tab--live' : ''}${isEditing ? ' slide-tab--active' : ''}`}
                onClick={() => onJumpToSlide(i)}
                title={unsaved ? 'Not saved to room yet — save slides to present' : `Present slide ${i + 1}`}
              >
                #{i + 1}
                {isLive ? <span className="slide-tab-badge">Live</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
      {compact && slideToEdit ? (
        <SlideEditorFields
          slide={slideToEdit}
          index={editIdx}
          slides={slides}
          onChange={onChange}
          update={update}
          showHeadNumber={false}
        />
      ) : (
        slides.map((slide, i) => (
          <SlideEditorFields
            key={slide.id}
            slide={slide}
            index={i}
            slides={slides}
            onChange={onChange}
            update={update}
            showHeadNumber
          />
        ))
      )}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onChange([...slides, newSlide()])}
      >
        + Add slide
      </button>
    </div>
  )
}

function SlideEditorFields({
  slide,
  index,
  slides,
  onChange,
  update,
  showHeadNumber = false,
}: {
  slide: Slide
  index: number
  slides: Slide[]
  onChange: (s: Slide[]) => void
  update: (i: number, patch: Partial<Slide>) => void
  showHeadNumber?: boolean
}) {
  return (
    <div className="slide-editor">
      <div className="slide-editor-head">
        {showHeadNumber ? <span>#{index + 1}</span> : null}
        <select
          value={slide.type}
          onChange={(e) => {
            const type = e.target.value as SlideType
            if (type === 'vote') {
              update(index, {
                type,
                options: slide.options?.length ? slide.options : ['Option A', 'Option B'],
              })
            } else {
              const { options: _removed, ...rest } = slide
              update(index, { ...rest, type })
            }
          }}
        >
          {SLIDE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {slides.length > 1 ? (
          <button
            type="button"
            className="btn-icon"
            aria-label="Remove slide"
            onClick={() => onChange(slides.filter((_, j) => j !== index))}
          >
            ×
          </button>
        ) : null}
      </div>
      <input
        className="input"
        value={slide.prompt}
        onChange={(e) => update(index, { prompt: e.target.value })}
        placeholder={SLIDE_PROMPT_PLACEHOLDER}
      />
      {slide.type === 'vote' ? (
        <VoteOptionsEditor
          options={slide.options ?? ['', '']}
          onChange={(options) => update(index, { options })}
        />
      ) : null}
    </div>
  )
}

function VoteOptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (o: string[]) => void
}) {
  const setOpt = (i: number, v: string) => {
    const next = [...options]
    next[i] = v
    onChange(next)
  }
  return (
    <div className="vote-options-editor">
      {options.map((o, i) => (
        <input
          key={i}
          className="input input-sm"
          value={o}
          placeholder={`Option ${i + 1}`}
          onChange={(e) => setOpt(i, e.target.value)}
        />
      ))}
      {options.length < 6 ? (
        <button type="button" className="btn btn-ghost small" onClick={() => onChange([...options, ''])}>
          + Option
        </button>
      ) : null}
      {options.length > 2 ? (
        <button
          type="button"
          className="btn btn-ghost small"
          onClick={() => onChange(options.slice(0, -1))}
        >
          Remove last
        </button>
      ) : null}
    </div>
  )
}
