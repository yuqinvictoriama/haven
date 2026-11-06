import { useEffect, useState } from 'react'
import { useApp } from '../App.jsx'
import { navigate } from '../lib/router.js'
import { db } from '../lib/db.js'
import { isSampleItem, loadSampleEvidence, removeSampleEvidence, withSampleProfile } from '../data/sampleEvidence.js'
import { isStandalone, isIOS, fmtDate } from '../lib/media.js'
import Hotline from '../components/Hotline.jsx'
import Sheet from '../components/Sheet.jsx'
import { Mic, Camera, Video, Note, Msg, Upload, Install, ChevR, Spark, Alert, kindIcon, X } from '../components/Icons.jsx'

export default function Home() {
  const { settings, setSettings, claudeMode, installEvt } = useApp()
  const [items, setItems] = useState([])
  const [showInstall, setShowInstall] = useState(false)
  const [sampleBusy, setSampleBusy] = useState(false)
  const [sampleMsg, setSampleMsg] = useState('')
  const [sampleErr, setSampleErr] = useState('')
  const refresh = () => db.all().then(setItems)
  useEffect(() => {
    db.all().then(setItems).catch(() => {})
  }, [])
  const incidents = items.reduce((n, i) => n + (i.analysis?.incidents?.length || 0), 0)
  const hasSamples = items.some(isSampleItem)

  const toggleSamples = async () => {
    setSampleBusy(true)
    setSampleMsg('')
    setSampleErr('')
    try {
      if (hasSamples) {
        const n = await removeSampleEvidence()
        setSampleMsg(`Removed ${n} sample item${n === 1 ? '' : 's'}.`)
      } else {
        const n = await loadSampleEvidence()
        setSettings((s) => ({ ...s, profile: withSampleProfile(s.profile) }))
        setSampleMsg(`Added ${n} sample items.`)
      }
      await refresh()
    } catch (e) {
      console.error('Sample evidence failed', e)
      setSampleErr('Sorry, the sample evidence could not be updated. Please try again.')
    } finally {
      setSampleBusy(false)
    }
  }
  const installed = isStandalone()

  const install = async () => {
    if (installEvt) {
      installEvt.prompt()
      try { await installEvt.userChoice } catch { /* dismissed */ }
    } else setShowInstall(true)
  }

  return (
    <>
      {!installed && !settings.installDismissed && (
        <div className="card purple card-tight row">
          <Install style={{ width: 22, height: 22, color: 'var(--purple-ink)', flex: 'none' }} />
          <div className="grow">
            <div style={{ fontWeight: 650, color: 'var(--purple-ink)' }}>Install Haven on your phone</div>
            <div className="small" style={{ color: 'var(--purple-ink)', opacity: 0.85 }}>On your home screen it looks like a unit converter called “Convert”, so it doesn't stand out.</div>
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--surface)', color: 'var(--purple-ink)' }} onClick={install}>How</button>
          <button className="icon-btn" aria-label="Dismiss" onClick={() => setSettings({ installDismissed: true })}><X /></button>
        </div>
      )}

      <Hotline />

      <div className="section-title">Capture now</div>
      <div className="grid-2">
        <button className="action-tile primary" onClick={() => navigate('/capture?mode=audio&auto=1')}>
          <span className="ico"><Mic /></span>
          <span className="label">Record audio</span>
          <span className="desc">Starts immediately</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/capture?mode=photo')}>
          <span className="ico yellow"><Camera /></span>
          <span className="label">Take photo</span>
          <span className="desc">Injuries, damage, notes</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/capture?mode=video&auto=1')}>
          <span className="ico"><Video /></span>
          <span className="label">Record video</span>
          <span className="desc">Camera and mic</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/capture?mode=note')}>
          <span className="ico"><Note /></span>
          <span className="label">Write a note</span>
          <span className="desc">What happened, when</span>
        </button>
      </div>
      <div className="grid-2">
        <button className="action-tile" onClick={() => navigate('/analyze')}>
          <span className="ico yellow"><Msg /></span>
          <span className="label">Paste texts</span>
          <span className="desc">Claude finds incidents and patterns</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/evidence?upload=1')}>
          <span className="ico"><Upload /></span>
          <span className="label">Upload evidence</span>
          <span className="desc">Screenshots, logs, photos, audio</span>
        </button>
      </div>

      <div className="section-title">Your evidence</div>
      <div className="card card-tight">
        <div className="row between">
          <div>
            <div style={{ fontWeight: 650 }}>{items.length} item{items.length === 1 ? '' : 's'}{incidents ? ` · ${incidents} incident${incidents === 1 ? '' : 's'} identified` : ''}</div>
            <div className="small muted">{items.length ? `Last added ${fmtDate(items[0].createdAt)}` : 'Everything stays on this device until you share it.'}</div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/evidence')}>Open</button>
        </div>
        {items.slice(0, 3).length > 0 && (
          <div className="list" style={{ marginTop: 10 }}>
            {items.slice(0, 3).map((it) => (
              <button key={it.id} className="list-item" onClick={() => navigate(`/evidence/${it.id}`)}>
                <span className="ico">{kindIcon(it.kind)}</span>
                <span className="meta"><span className="t">{it.title || '(untitled)'}</span><span className="s">{fmtDate(it.capturedAt)}</span></span>
                <ChevR className="chev" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card card-tight stack">
        <div className="small muted">Serena and Marcus are made up. Use this to try Review notes and Documents.</div>
        <div className="row">
          <button className="btn btn-sm btn-secondary" disabled={sampleBusy} onClick={toggleSamples}>
            {hasSamples ? 'Remove sample evidence' : 'Load sample evidence (made-up demo data)'}
          </button>
          {hasSamples && <button className="btn btn-sm btn-ghost" onClick={() => navigate('/evidence')}>View in Evidence</button>}
        </div>
        {sampleMsg && <div className="notice ok">{sampleMsg}</div>}
        {sampleErr && <div className="notice danger"><Alert />{sampleErr}</div>}
      </div>

      <div className="section-title">Documents</div>
      <button className="list-item card" style={{ padding: 14 }} onClick={() => navigate('/generate')}>
        <span className="ico yellow"><Spark /></span>
        <span className="meta"><span className="t">Generate documents with Claude</span><span className="s">Restraining order request, description of abuse, exhibit list, advocate summary, criminal case packet, and more</span></span>
        <ChevR className="chev" />
      </button>

      <div className="tiny" style={{ textAlign: 'center' }}>
        Claude: {claudeMode === 'live' ? 'connected' : claudeMode === 'key' ? 'using your key' : 'demo mode'} · <a href="/settings" onClick={(e) => { e.preventDefault(); navigate('/settings') }}>settings</a>
      </div>

      <Sheet open={showInstall} onClose={() => setShowInstall(false)} title="Add Haven to your home screen">
        {isIOS ? (
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Open this page in <b>Safari</b> (required on iPhone).</li>
            <li>Tap the <b>Share</b> button (square with an arrow).</li>
            <li>Scroll and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li>Open <b>Convert</b> (ruler icon) from your home screen. It opens straight into Haven, full screen like an app.</li>
          </ol>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Open this page in <b>Chrome</b>.</li>
            <li>Tap the <b>⋮</b> menu, then <b>Add to Home screen</b> or <b>Install app</b>.</li>
            <li>Confirm. Haven appears with your other apps as <b>Convert</b> with a ruler icon.</li>
          </ol>
        )}
        <button className="btn btn-primary btn-block" onClick={() => setShowInstall(false)}>Done</button>
      </Sheet>
    </>
  )
}
