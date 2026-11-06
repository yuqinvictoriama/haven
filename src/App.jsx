import { createContext, useContext, useEffect, useState } from 'react'
import { useRoute, navigate, back } from './lib/router.js'
import { loadSettings, saveSettings } from './lib/db.js'
import { health } from './lib/api.js'
import { useShake } from './lib/shake.js'
import { DOC_KINDS } from './lib/demo.js'
import { Home as HomeIco, Folder, Mic, Doc, Cog, Exit, Back } from './components/Icons.jsx'
import Home from './pages/Home.jsx'
import Capture from './pages/Capture.jsx'
import Evidence from './pages/Evidence.jsx'
import EvidenceDetail from './pages/EvidenceDetail.jsx'
import Analyze from './pages/Analyze.jsx'
import Generate from './pages/Generate.jsx'
import Generator from './pages/Generator.jsx'
import Settings from './pages/Settings.jsx'
import Review from './pages/Review.jsx'
import NextSteps from './pages/NextSteps.jsx'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const TABS = [
  { to: '/', label: 'Home', Icon: HomeIco, match: (p) => p === '/' },
  { to: '/evidence', label: 'Evidence', Icon: Folder, match: (p) => p.startsWith('/evidence') },
  { to: '/capture', label: 'Capture', Icon: Mic, match: (p) => p.startsWith('/capture'), capture: true },
  { to: '/generate', label: 'Documents', Icon: Doc, match: (p) => p.startsWith('/generate') || p === '/next-steps' },
  { to: '/settings', label: 'More', Icon: Cog, match: (p) => p.startsWith('/settings') },
]

function titleFor(path, query) {
  const [root, sub] = path.split('/').filter(Boolean)
  if (!root) return null
  if (root === 'capture') return 'Capture'
  if (root === 'evidence') return sub ? 'Evidence item' : 'Evidence'
  if (root === 'analyze' || root === 'share') return 'Add log'
  if (root === 'review') return 'Review notes'
  if (root === 'next-steps') return 'Next steps'
  if (root === 'generate') return sub ? DOC_KINDS.find((d) => d.kind === sub)?.title || 'Document' : 'Documents'
  if (root === 'settings') return query.get('section') || 'More'
  return 'Haven'
}

export default function App() {
  const { path, query } = useRoute()
  const [settings, setSettingsState] = useState(loadSettings)
  const [status, setStatus] = useState({ ok: null, claude: false })
  const [installEvt, setInstallEvt] = useState(null)

  const setSettings = (patch) => {
    setSettingsState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }

  useEffect(() => {
    health().then(setStatus)
    const onInstall = (e) => {
      e.preventDefault()
      setInstallEvt(e)
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  useShake(settings.shake, () => {
    if (!path.startsWith('/capture')) navigate('/capture?mode=audio&auto=1')
  })

  const quickExit = () => {
    try {
      window.location.replace(settings.exitUrl || 'https://www.google.com')
    } catch {
      window.location.href = 'https://www.google.com'
    }
  }

  const claudeMode = status.claude ? 'live' : settings.apiKey?.trim() ? 'key' : 'demo'
  const ctx = { settings, setSettings, status, claudeMode, installEvt, setInstallEvt, quickExit }

  const [root, sub] = path.split('/').filter(Boolean)
  let page
  switch (root) {
    case undefined: page = <Home />; break
    case 'capture': page = <Capture />; break
    case 'evidence': page = sub ? <EvidenceDetail id={sub} /> : <Evidence />; break
    case 'analyze': page = <Analyze />; break
    case 'share': page = <Analyze shared />; break
    case 'review': page = <Review />; break
    case 'generate': page = sub ? <Generator kind={sub} /> : <Generate />; break
    case 'settings': page = <Settings />; break
    case 'next-steps': page = <NextSteps />; break
    default: page = <Home />
  }
  const title = titleFor(path, query)
  const nested = !!sub || root === 'analyze' || root === 'share' || root === 'review' || root === 'next-steps'
  const fallback = root === 'generate' || root === 'next-steps' ? '/generate' : root === 'evidence' ? '/evidence' : '/'

  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        <header className="topbar">
          {nested ? (
            <button className="icon-btn" aria-label="Back" onClick={() => back(fallback)}><Back /></button>
          ) : null}
          <div className="title">
            {title ? <span>{title}</span> : <span className="wordmark"><img className="logo" src="/logo.png" alt="" />Haven</span>}
          </div>
          <button className="btn btn-exit no-print" onClick={quickExit} title="Leave this site immediately"><Exit /> Exit</button>
        </header>
        <main className="main">{page}</main>
        <nav className="tabbar no-print" aria-label="Main">
          <div className="tabbar-inner">
            {TABS.map(({ to, label, Icon, match, capture }) => (
              <button key={to} className={'tab' + (capture ? ' capture' : '') + (match(path) ? ' active' : '')} onClick={() => navigate(to)} aria-label={label}>
                {capture ? <span className="tab-ico"><Icon /></span> : <Icon />}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </AppCtx.Provider>
  )
}
