import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'
import type { FirebaseConfig } from '../types'

export function readFirebaseConfig(): FirebaseConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID
  if (!apiKey || !databaseURL || !projectId) return null
  return {
    apiKey,
    authDomain: authDomain ?? '',
    databaseURL,
    projectId,
    appId: appId ?? '',
  }
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Database | null = null

export function isFirebaseConfigured(): boolean {
  return readFirebaseConfig() !== null
}

export function getFirebaseApp(): FirebaseApp {
  const config = readFirebaseConfig()
  if (!config) throw new Error('Firebase is not configured')
  if (!app) {
    app = initializeApp(config)
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

export function getFirebaseDb(): Database {
  if (!db) db = getDatabase(getFirebaseApp())
  return db
}

export async function ensureAnonymousAuth(): Promise<string> {
  const a = getFirebaseAuth()
  if (a.currentUser) return a.currentUser.uid
  const cred = await signInAnonymously(a)
  return cred.user.uid
}
