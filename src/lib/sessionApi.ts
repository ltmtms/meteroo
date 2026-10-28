import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from 'firebase/database'
import type { SessionData, ShortAnswer, Slide, VoteRecord, WordEntry } from '../types'
import { MAX_WORDS_PER_PARTICIPANT_PER_SLIDE } from '../types'
import {
  demoAddShort,
  demoAddWord,
  demoClearSlideResponses,
  demoGetSession,
  demoGetWords,
  demoSetSession,
  demoSetVote,
  demoSubscribeSession,
  demoSubscribeShorts,
  demoSubscribeVotes,
  demoSubscribeWords,
} from './demoStore'
import { ensureAnonymousAuth, getFirebaseDb, isFirebaseConfigured } from './firebase'
import {
  sanitizeForFirebase,
  sanitizeSessionForFirebase,
  sanitizeSessionPatchForFirebase,
  sanitizeSlides,
} from './sanitizeFirebase'

export function useRealtimeMode(): 'firebase' | 'demo' {
  return isFirebaseConfigured() ? 'firebase' : 'demo'
}

function sessionRef(code: string) {
  return ref(getFirebaseDb(), `sessions/${code.toUpperCase()}`)
}

function responsesRef(code: string, slideIndex: number, kind: 'words' | 'shorts' | 'votes') {
  return ref(getFirebaseDb(), `sessions/${code.toUpperCase()}/responses/${slideIndex}/${kind}`)
}

export async function createSession(code: string, adminUid: string, slides: Slide[]): Promise<void> {
  const session = sanitizeSessionForFirebase({
    adminUid,
    currentSlideIndex: 0,
    slides,
    createdAt: Date.now(),
  })
  if (!isFirebaseConfigured()) {
    demoSetSession(code, session)
    return
  }
  await set(sessionRef(code), session)
}

export async function joinSessionExists(code: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return demoGetSession(code) !== null
  }
  const snap = await get(sessionRef(code))
  return snap.exists()
}

export function subscribeSession(
  code: string,
  cb: (session: SessionData | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    return demoSubscribeSession(code, cb)
  }
  const unsub = onValue(sessionRef(code), (snap) => {
    cb(snap.exists() ? (snap.val() as SessionData) : null)
  })
  return () => unsub()
}

export async function updateSession(code: string, patch: Partial<SessionData>): Promise<void> {
  if (!isFirebaseConfigured()) {
    const current = demoGetSession(code)
    if (!current) return
    demoSetSession(code, { ...current, ...patch })
    return
  }
  await update(sessionRef(code), sanitizeSessionPatchForFirebase(patch))
}

export async function setSlides(code: string, slides: Slide[]): Promise<void> {
  const sanitized = sanitizeSlides(slides)
  const maxIdx = Math.max(0, sanitized.length - 1)

  if (!isFirebaseConfigured()) {
    const current = demoGetSession(code)
    if (!current) return
    const currentSlideIndex = Math.min(current.currentSlideIndex, maxIdx)
    demoSetSession(code, { ...current, slides: sanitized, currentSlideIndex })
    return
  }

  const snap = await get(sessionRef(code))
  if (!snap.exists()) return
  const current = snap.val() as SessionData
  const currentSlideIndex = Math.min(current.currentSlideIndex ?? 0, maxIdx)
  await update(
    sessionRef(code),
    sanitizeSessionPatchForFirebase({ slides: sanitized, currentSlideIndex }),
  )
}

export async function setCurrentSlide(code: string, index: number): Promise<void> {
  await updateSession(code, { currentSlideIndex: index })
}

export async function resetSlideResponses(code: string, slideIndex: number): Promise<void> {
  if (!isFirebaseConfigured()) {
    demoClearSlideResponses(code, slideIndex)
    return
  }
  await remove(responsesRef(code, slideIndex, 'words'))
  await remove(responsesRef(code, slideIndex, 'shorts'))
  await remove(responsesRef(code, slideIndex, 'votes'))
}

export async function submitWord(
  code: string,
  slideIndex: number,
  text: string,
  nickname?: string,
): Promise<void> {
  const uid = isFirebaseConfigured() ? await ensureAnonymousAuth() : getDemoParticipantId()
  const wordsPath = isFirebaseConfigured()
    ? responsesRef(code, slideIndex, 'words')
    : null

  if (isFirebaseConfigured() && wordsPath) {
    const snap = await get(wordsPath)
    const existing = (snap.val() ?? {}) as Record<string, WordEntry>
    const count = Object.values(existing).filter((e) => e.uid === uid).length
    if (count >= MAX_WORDS_PER_PARTICIPANT_PER_SLIDE) {
      throw new Error(`You can submit up to ${MAX_WORDS_PER_PARTICIPANT_PER_SLIDE} words on this slide.`)
    }
  } else {
    const existing = demoGetWords(code, slideIndex)
    const count = Object.values(existing).filter((e) => e.uid === uid).length
    if (count >= MAX_WORDS_PER_PARTICIPANT_PER_SLIDE) {
      throw new Error(`You can submit up to ${MAX_WORDS_PER_PARTICIPANT_PER_SLIDE} words on this slide.`)
    }
  }

  const entry = sanitizeForFirebase({ text, nickname, uid, at: Date.now() })
  if (!isFirebaseConfigured()) {
    demoAddWord(code, slideIndex, entry)
    return
  }
  await push(responsesRef(code, slideIndex, 'words'), entry)
}

export function subscribeWords(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, WordEntry>) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    return demoSubscribeWords(code, slideIndex, cb)
  }
  return onValue(responsesRef(code, slideIndex, 'words'), (snap) => {
    cb(snap.val() ?? {})
  })
}

export async function submitShortAnswer(
  code: string,
  slideIndex: number,
  text: string,
  nickname?: string,
): Promise<void> {
  const uid = isFirebaseConfigured() ? await ensureAnonymousAuth() : `demo-${crypto.randomUUID()}`
  const answer = sanitizeForFirebase({ text, nickname, uid, at: Date.now() })
  if (!isFirebaseConfigured()) {
    demoAddShort(code, slideIndex, crypto.randomUUID(), answer)
    return
  }
  await push(responsesRef(code, slideIndex, 'shorts'), answer)
}

export function subscribeShortAnswers(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, ShortAnswer>) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    return demoSubscribeShorts(code, slideIndex, cb)
  }
  return onValue(responsesRef(code, slideIndex, 'shorts'), (snap) => {
    cb(snap.val() ?? {})
  })
}

export async function submitVote(
  code: string,
  slideIndex: number,
  optionIndex: number,
): Promise<void> {
  const uid = isFirebaseConfigured() ? await ensureAnonymousAuth() : getDemoParticipantId()
  const vote: VoteRecord = { optionIndex, at: Date.now() }
  if (!isFirebaseConfigured()) {
    demoSetVote(code, slideIndex, uid, vote)
    return
  }
  await set(
    ref(getFirebaseDb(), `sessions/${code.toUpperCase()}/responses/${slideIndex}/votes/${uid}`),
    vote,
  )
}

export function subscribeVotes(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, VoteRecord>) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    return demoSubscribeVotes(code, slideIndex, cb)
  }
  return onValue(responsesRef(code, slideIndex, 'votes'), (snap) => {
    cb(snap.val() ?? {})
  })
}

const DEMO_PARTICIPANT_KEY = 'meteroo-demo-participant'

function getDemoParticipantId(): string {
  let id = localStorage.getItem(DEMO_PARTICIPANT_KEY)
  if (!id) {
    id = `demo-${crypto.randomUUID()}`
    localStorage.setItem(DEMO_PARTICIPANT_KEY, id)
  }
  return id
}

export async function getParticipantUid(): Promise<string> {
  if (!isFirebaseConfigured()) return getDemoParticipantId()
  return ensureAnonymousAuth()
}

export function getStoredVote(code: string, slideIndex: number): number | null {
  const uid = localStorage.getItem(DEMO_PARTICIPANT_KEY)
  if (!uid && isFirebaseConfigured()) return null
  // For firebase we'll read from subscription; for demo use localStorage key
  const key = `meteroo-vote:${code}:${slideIndex}`
  const raw = localStorage.getItem(key)
  return raw !== null ? Number(raw) : null
}

export function storeLocalVote(code: string, slideIndex: number, optionIndex: number): void {
  localStorage.setItem(`meteroo-vote:${code}:${slideIndex}`, String(optionIndex))
}
