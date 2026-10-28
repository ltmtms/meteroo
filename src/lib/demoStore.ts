import type { SessionData, ShortAnswer, VoteRecord, WordEntry } from '../types'

const PREFIX = 'meteroo-demo-v1'

function key(code: string): string {
  return `${PREFIX}:${code.toUpperCase()}`
}

interface DemoBucket {
  session: SessionData | null
  words: Record<string, Record<string, WordEntry>>
  shorts: Record<string, Record<string, ShortAnswer>>
  votes: Record<string, Record<string, VoteRecord>>
}

function load(code: string): DemoBucket {
  const raw = localStorage.getItem(key(code))
  if (!raw) {
    return { session: null, words: {}, shorts: {}, votes: {} }
  }
  try {
    return JSON.parse(raw) as DemoBucket
  } catch {
    return { session: null, words: {}, shorts: {}, votes: {} }
  }
}

function save(code: string, bucket: DemoBucket): void {
  localStorage.setItem(key(code), JSON.stringify(bucket))
  window.dispatchEvent(new CustomEvent('meteroo-demo-update', { detail: { code } }))
}

export function demoGetSession(code: string): SessionData | null {
  return load(code).session
}

export function demoSetSession(code: string, session: SessionData): void {
  const b = load(code)
  b.session = session
  save(code, b)
}

export function demoSubscribeSession(
  code: string,
  cb: (session: SessionData | null) => void,
): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ code: string }>).detail
    if (detail.code.toUpperCase() === code.toUpperCase()) cb(demoGetSession(code))
  }
  cb(demoGetSession(code))
  window.addEventListener('meteroo-demo-update', handler)
  const id = window.setInterval(() => cb(demoGetSession(code)), 800)
  return () => {
    window.removeEventListener('meteroo-demo-update', handler)
    window.clearInterval(id)
  }
}

function slideKey(index: number): string {
  return String(index)
}

export function demoAddWord(code: string, slideIndex: number, entry: WordEntry): void {
  const b = load(code)
  const sk = slideKey(slideIndex)
  if (!b.words[sk]) b.words[sk] = {}
  b.words[sk][crypto.randomUUID()] = entry
  save(code, b)
}

export function demoGetWords(code: string, slideIndex: number): Record<string, WordEntry> {
  return load(code).words[slideKey(slideIndex)] ?? {}
}

export function demoSubscribeWords(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, WordEntry>) => void,
): () => void {
  const pull = () => cb(demoGetWords(code, slideIndex))
  pull()
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ code: string }>).detail
    if (detail.code.toUpperCase() === code.toUpperCase()) pull()
  }
  window.addEventListener('meteroo-demo-update', handler)
  const id = window.setInterval(pull, 800)
  return () => {
    window.removeEventListener('meteroo-demo-update', handler)
    window.clearInterval(id)
  }
}

export function demoAddShort(code: string, slideIndex: number, id: string, answer: ShortAnswer): void {
  const b = load(code)
  const sk = slideKey(slideIndex)
  if (!b.shorts[sk]) b.shorts[sk] = {}
  b.shorts[sk][id] = answer
  save(code, b)
}

export function demoGetShorts(code: string, slideIndex: number): Record<string, ShortAnswer> {
  return load(code).shorts[slideKey(slideIndex)] ?? {}
}

export function demoSubscribeShorts(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, ShortAnswer>) => void,
): () => void {
  const pull = () => cb(demoGetShorts(code, slideIndex))
  pull()
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ code: string }>).detail
    if (detail.code.toUpperCase() === code.toUpperCase()) pull()
  }
  window.addEventListener('meteroo-demo-update', handler)
  const id = window.setInterval(pull, 800)
  return () => {
    window.removeEventListener('meteroo-demo-update', handler)
    window.clearInterval(id)
  }
}

export function demoSetVote(code: string, slideIndex: number, uid: string, vote: VoteRecord): void {
  const b = load(code)
  const sk = slideKey(slideIndex)
  if (!b.votes[sk]) b.votes[sk] = {}
  b.votes[sk][uid] = vote
  save(code, b)
}

export function demoGetVotes(code: string, slideIndex: number): Record<string, VoteRecord> {
  return load(code).votes[slideKey(slideIndex)] ?? {}
}

export function demoSubscribeVotes(
  code: string,
  slideIndex: number,
  cb: (entries: Record<string, VoteRecord>) => void,
): () => void {
  const pull = () => cb(demoGetVotes(code, slideIndex))
  pull()
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ code: string }>).detail
    if (detail.code.toUpperCase() === code.toUpperCase()) pull()
  }
  window.addEventListener('meteroo-demo-update', handler)
  const id = window.setInterval(pull, 800)
  return () => {
    window.removeEventListener('meteroo-demo-update', handler)
    window.clearInterval(id)
  }
}

export function demoClearSlideResponses(code: string, slideIndex: number): void {
  const b = load(code)
  const sk = slideKey(slideIndex)
  delete b.words[sk]
  delete b.shorts[sk]
  delete b.votes[sk]
  save(code, b)
}
