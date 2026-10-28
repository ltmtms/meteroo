import { Link } from 'react-router-dom'
import { isFirebaseConfigured } from '../lib/firebase'
import { ShortAnswersView } from './ShortAnswersView'
import { VoteChartView } from './VoteChartView'
import { WordCloudView } from './WordCloudView'
import type { ShortAnswer, VoteRecord, WordEntry } from '../types'

export function FirebaseBanner() {
  if (isFirebaseConfigured()) return null
  return (
    <div className="banner banner--warn" role="status">
      <strong>Demo mode</strong> — data stays in this browser only. For phones and projectors on
      different devices, add Firebase env vars (see README).{' '}
      <span lang="zh-HK">示範模式：僅本機瀏覽器。跨裝置請設定 Firebase。</span>
    </div>
  )
}

export function AppShell({
  children,
  title,
  dark,
  hideBrand,
}: {
  children: React.ReactNode
  title?: string
  dark?: boolean
  hideBrand?: boolean
}) {
  return (
    <div className={`app-shell${dark ? ' app-shell--dark' : ''}`}>
      <FirebaseBanner />
      {!hideBrand && title ? (
        <header className="app-header">
          <Link to="/" className="brand">
            meteroo
          </Link>
          <span className="app-header-title">{title}</span>
        </header>
      ) : null}
      <main className="app-main">{children}</main>
    </div>
  )
}

export function SlideResults({
  type,
  prompt,
  options,
  words,
  shorts,
  votes,
  shuffleShort,
}: {
  type: 'wordcloud' | 'short' | 'vote'
  prompt: string
  options?: string[]
  words: Record<string, WordEntry>
  shorts: Record<string, ShortAnswer>
  votes: Record<string, VoteRecord>
  shuffleShort?: boolean
}) {
  return (
    <section className="slide-results">
      <h1 className="slide-prompt">{prompt}</h1>
      {type === 'wordcloud' ? (
        <WordCloudView entries={words} />
      ) : type === 'short' ? (
        <ShortAnswersView entries={shorts} shuffle={shuffleShort} />
      ) : (
        <VoteChartView options={options ?? []} votes={votes} />
      )}
    </section>
  )
}
