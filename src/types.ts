export type SlideType = 'wordcloud' | 'short' | 'vote'

export interface Slide {
  id: string
  type: SlideType
  prompt: string
  options?: string[]
}

export interface SessionData {
  adminUid: string
  currentSlideIndex: number
  slides: Slide[]
  createdAt: number
}

export interface WordEntry {
  text: string
  nickname?: string
  at: number
}

export interface ShortAnswer {
  text: string
  nickname?: string
  uid: string
  at: number
}

export interface VoteRecord {
  optionIndex: number
  at: number
}

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  appId: string
}
