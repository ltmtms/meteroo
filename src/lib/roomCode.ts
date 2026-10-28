const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateRoomCode(length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('')
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '')
}

export function normalizeWord(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}
