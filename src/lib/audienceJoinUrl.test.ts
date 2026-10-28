import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { audienceJoinUrl } from './audienceJoinUrl'

describe('audienceJoinUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://ltmtms.github.io' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds join URL with Vite base path', () => {
    vi.stubEnv('BASE_URL', '/meteroo/')
    expect(audienceJoinUrl('9R48Y')).toBe(
      'https://ltmtms.github.io/meteroo/start/?code=9R48Y',
    )
  })
})
