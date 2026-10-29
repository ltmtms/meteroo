#!/usr/bin/env node
/**
 * Export VITE_FIREBASE_* from Actions secrets (preferred) or config/firebase.public.json.
 * Web config is public in the SPA bundle; prefer GitHub Actions secrets when set.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const keys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

const fromEnv = (k) => process.env[k]?.trim() || ''

let missing = keys.filter((k) => !fromEnv(k))

if (missing.length > 0) {
  const dir = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(dir, '../config/firebase.public.json'), 'utf8')
  const pub = JSON.parse(raw)
  for (const k of missing) {
    if (pub[k]) process.env[k] = String(pub[k])
  }
  missing = keys.filter((k) => !fromEnv(k))
}

if (missing.length > 0) {
  console.error('Missing Firebase config:', missing.join(', '))
  process.exit(1)
}

const lines = keys.map((k) => `${k}=${fromEnv(k)}`).join('\n') + '\n'
writeFileSync('.env.production.local', lines)
console.log('Wrote .env.production.local for Vite build')
