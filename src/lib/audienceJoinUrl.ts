/** Full audience join URL for the current deployment (GitHub Pages base path aware). */
export function audienceJoinUrl(roomCode: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const path = `${normalizedBase}start/?code=${encodeURIComponent(roomCode)}`
  return `${window.location.origin}${path}`
}
