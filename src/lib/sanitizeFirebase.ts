import type { SessionData, Slide } from '../types'

/** Deep-remove `undefined` so Firebase RTDB accepts the payload. */
export function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as T
  }
  if (typeof value !== 'object') {
    return value
  }
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      out[key] = stripUndefined(val)
    }
  }
  return out as T
}

const DEFAULT_VOTE_OPTIONS = ['Option A', 'Option B']

export function sanitizeSlide(slide: Slide): Slide {
  if (slide.type === 'vote') {
    const options = (slide.options ?? []).map((o) => o.trim()).filter(Boolean).slice(0, 6)
    return {
      id: slide.id,
      type: slide.type,
      prompt: slide.prompt,
      options: options.length >= 2 ? options : [...DEFAULT_VOTE_OPTIONS],
    }
  }
  return {
    id: slide.id,
    type: slide.type,
    prompt: slide.prompt,
  }
}

export function sanitizeSlides(slides: Slide[]): Slide[] {
  return slides.map(sanitizeSlide)
}

export function sanitizeSessionForFirebase(session: SessionData): SessionData {
  return stripUndefined({
    ...session,
    slides: sanitizeSlides(session.slides),
  })
}

export function sanitizeSessionPatchForFirebase(
  patch: Partial<SessionData>,
): Partial<SessionData> {
  const next: Partial<SessionData> = { ...patch }
  if (next.slides) {
    next.slides = sanitizeSlides(next.slides)
  }
  return stripUndefined(next)
}

/** Strip optional fields (e.g. nickname) before response writes. */
export function sanitizeForFirebase<T extends Record<string, unknown>>(value: T): T {
  return stripUndefined(value)
}
