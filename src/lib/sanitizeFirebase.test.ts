import { describe, expect, it } from 'vitest'
import {
  sanitizeSessionForFirebase,
  sanitizeSlide,
  stripUndefined,
} from './sanitizeFirebase'
import type { SessionData } from '../types'

describe('stripUndefined', () => {
  it('removes undefined keys at all depths', () => {
    expect(
      stripUndefined({
        a: 1,
        b: undefined,
        nested: { ok: 'x', drop: undefined, arr: [1, undefined, 2] },
      }),
    ).toEqual({
      a: 1,
      nested: { ok: 'x', arr: [1, 2] },
    })
  })
})

describe('sanitizeSlide', () => {
  it('omits options for word cloud slides', () => {
    expect(
      sanitizeSlide({
        id: '1',
        type: 'wordcloud',
        prompt: 'Words?',
        options: undefined,
      }),
    ).toEqual({
      id: '1',
      type: 'wordcloud',
      prompt: 'Words?',
    })
  })

  it('ensures vote slides have at least two options', () => {
    expect(
      sanitizeSlide({
        id: '2',
        type: 'vote',
        prompt: 'Pick',
        options: ['Only'],
      }).options,
    ).toEqual(['Option A', 'Option B'])
  })
})

describe('sanitizeSessionForFirebase', () => {
  it('produces RTDB-safe session with word cloud first slide', () => {
    const session: SessionData = {
      adminUid: 'uid',
      currentSlideIndex: 0,
      createdAt: 1,
      slides: [
        {
          id: 's0',
          type: 'wordcloud',
          prompt: 'Say a word',
          options: undefined,
        },
      ],
    }
    const out = sanitizeSessionForFirebase(session)
    expect(out.slides[0]).not.toHaveProperty('options')
    expect(JSON.stringify(out)).not.toContain('undefined')
  })
})
