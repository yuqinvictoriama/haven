import { useEffect, useState } from 'react'
import { useApp } from '../App.jsx'
import { navigate } from '../lib/router.js'
import { db } from '../lib/db.js'
import { isStandalone, isIOS, isAndroid, permissionState, requestMedia, stopStream, getLocation, requestMotionPermission, supportsRecorder } from '../lib/media.js'
import { GESTURE_GUIDES } from '../content/gestures.js'
import Hotline from '../components/Hotline.jsx'
import Sheet from '../components/Sheet.jsx'
import Accordion from '../components/Accordion.jsx'
import { Install, Mic, Camera, Pin, Wave, Spark, Shield, Trash, Alert, Check, Exit } from '../components/Icons.jsx'

function Perm({ icon, label, state, onAsk, hint }) {
  const cls = state === 'granted' ? 'ok' : state === 'denied' ? 'danger' : ''
  return (
    <div className="toggle">
      <span className="row grow" style={{ gap: 10 }}>
        <span style={{ width: 22, height: 22, color: 'var(--text-2)' }}>{icon}</span>
        <span className="grow"><div style={{ fontWeight: 600 }}>{label}</div>{hint && <div className="tiny">{hint}</div>}</span>
      </span>
      <span className="row" style={{ gap: 8 }}>
        <span className={'badge ' + cls}>{state === 'granted' ? 'allowed' : state === 'denied' ? 'blocked' : state === 'prompt' ? 'not yet' : '—'}</span>
        {state !== 'granted' && <button className="btn btn-sm btn-secondary" onClick={onAsk}>Allow</button>}
      </span>
    </div>
  )
}

export default function Settings() {
  const { settings, setSettings, status, claudeMode, installEvt } = useApp()
  const [perm, setPerm] = useState({ microphone: 'unknown', camera: 'unknown', geolocation: 'unknown', motion: 'unknown' })
  const [key, setKey] = useState(settings.apiKey || '')
  const [keySaved, setKeySaved] = useState(false)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [wiped, setWiped] = useState(false)
  const installed = isStandalone()
  const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'all'

  const refresh = async () => {
    const [microphone, camera, geolocation] = await Promise.all([permissionState('microphone'), permissionState('camera'), permissionState('geolocation')])
    setPerm((p) => ({ ...p, microphone, camera, geolocation }))
  }
  useEffect(() => { refresh() }, [])

  const askMic = async () => { try { stopStream(await requestMedia({ audio: true })); setPerm((p) => ({ ...p, microphone: 'granted' })) } catch { setPerm((p) => ({ ...p, microphone: 'denied' })) } refresh() }
  const askCam = async () => { try { stopStream(await requestMedia({ video: true })); setPerm((p) => ({ ...p, camera: 'granted' })) } catch { setPerm((p) => ({ ...p, camera: 'denied' })) } refresh() }
  const askLoc = async () => { const r = await getLocation(); setPerm((p) => ({ ...p, geolocation: r ? 'granted' : 'denied' })); refresh() }
  const askMotion = async () => { const ok = await requestMotionPermission(); setPerm((p) => ({ ...p, motion: ok ? 'granted' : 'denied' })); return ok }

  const toggleShake = async () => {
    if (settings.shake) return setSettings({ shake: false })
    const ok = await askMotion()
    setSettings({ shake: ok })
  }
  const saveKey = () => { setSettings({ apiKey: key.trim() }); setKeySaved(true); setTimeout(() => setKeySaved(false), 1500) }
  const wipe = async () => {
    await db.clear()
    try { localStorage.removeItem('haven.settings') } catch { /* ignore */ }
    setConfirmWipe(false)
    setWiped(true)
    setTimeout(() => window.location.replace('/'), 800)
  }
  const guides = GESTURE_GUIDES.filter((g) => g.platform === platform || g.platform === 'all' || platform === 'all')
  const otherGuides = GESTURE_GUIDES.filter((g) => !guides.includes(g))

  return (
    <>
      <Hotline compact />

      <div className="section-title">Install</div>
      <div className="card">
        <div className="row between">
          <span className="row" style={{ gap: 10 }}><Install style={{ width: 22, height: 22, color: 'var(--purple-ink)' }} /><span><div style={{ fontWeight: 600 }}>{installed ? 'Installed on this device' : 'Not installed yet'}</div><div className="tiny">{installed ? 'Opens full screen from the “Convert” icon (a ruler) on your home screen.' : 'Install for one-tap access. On your home screen it appears as “Convert” with a ruler icon.'}</div></span></span>
          {!installed && (installEvt ? <button className="btn btn-sm btn-primary" onClick={() => installEvt.prompt()}>Install</button> : null)}
        </div>
        {!installed && (
          <div className="small muted" style={{ marginTop: 10 }}>
            {isIOS ? <>In Safari: tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</> : <>In Chrome: tap <b>⋮</b> → <b>Add to Home screen</b> / <b>Install app</b>.</>}
          </div>
        )}
      </div>

      <div className="section-title">Permissions</div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <Perm icon={<Mic />} label="Microphone" state={perm.microphone} onAsk={askMic} hint="Audio and video recordings" />
        <Perm icon={<Camera />} label="Camera" state={perm.camera} onAsk={askCam} hint="Photos and video" />
        <Perm icon={<Pin />} label="Location" state={perm.geolocation} onAsk={askLoc} hint="Optional: tag where evidence was captured" />
        <Perm icon={<Wave />} label="Motion (shake to record)" state={perm.motion} onAsk={askMotion} hint={isIOS ? 'iPhone asks once per install' : 'Usually allowed automatically'} />
        {!supportsRecorder && <div className="notice warn" style={{ margin: '8px 0' }}><Alert />This browser cannot record in-app. Haven will use the system camera and recorder instead.</div>}
        {isIOS && <div className="tiny" style={{ padding: '8px 0' }}>If something is blocked: iPhone Settings → Apps → Safari (or Convert, once installed) → Microphone / Camera.</div>}
      </div>

      <div className="section-title">Capture gestures</div>
      <div className="card">
        <div className="toggle">
          <span className="grow"><div style={{ fontWeight: 600 }}>Shake to start recording</div><div className="tiny">Shake the phone twice while Haven is open to start an audio recording.</div></span>
          <button className={'switch' + (settings.shake ? ' on' : '')} onClick={toggleShake} role="switch" aria-checked={settings.shake} aria-label="Shake to record" />
        </div>
        <div className="toggle">
          <span className="grow"><div style={{ fontWeight: 600 }}>Tag location on captures</div><div className="tiny">Stores GPS coordinates with each new item. Off by default.</div></span>
          <button className={'switch' + (settings.locationTag ? ' on' : '')} onClick={() => setSettings({ locationTag: !settings.locationTag })} role="switch" aria-checked={settings.locationTag} aria-label="Tag location" />
        </div>
      </div>
      <div className="stack">
        {guides.map((g) => (
          <Accordion key={g.id} title={g.title} badge={g.platform !== 'all' ? <span className="badge purple">{g.platform === 'ios' ? 'iPhone' : 'Android'}</span> : null}>
            <p>{g.summary}</p>
            <ol>{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            {g.note && <p className="tiny">{g.note}</p>}
          </Accordion>
        ))}
        {otherGuides.length > 0 && (
          <Accordion title="Other platforms">
            <div className="stack">
              {otherGuides.map((g) => (
                <div key={g.id}><div style={{ fontWeight: 600, color: 'var(--text)' }}>{g.title}</div><p>{g.summary}</p><ol>{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>{g.note && <p className="tiny">{g.note}</p>}</div>
              ))}
            </div>
          </Accordion>
        )}
        <div className="tiny">Full details and limitations are in EDGE-SPEC.md in the project repository.</div>
      </div>

      <div className="section-title">Claude</div>
      <div className="card stack">
        <div className="row" style={{ gap: 10 }}>
          <Spark style={{ width: 22, height: 22, color: 'var(--yellow-ink)' }} />
          <span className="grow">
            <div style={{ fontWeight: 600 }}>{claudeMode === 'live' ? 'Connected (server key)' : claudeMode === 'key' ? 'Using the key saved on this phone' : 'Demo mode'}</div>
            <div className="tiny">{status.ok === false ? 'API unreachable (offline?)' : claudeMode === 'live' ? 'Analysis and documents use Claude Opus 5.5.' : 'Add an Anthropic API key to turn on real analysis and drafts.'}</div>
          </span>
        </div>
        {claudeMode !== 'live' && (
          <>
            <div className="field"><label>Anthropic API key (stays in this browser only)</label><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" /></div>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => { setKey(''); setSettings({ apiKey: '' }) }}>Clear</button>
              <button className="btn btn-primary" onClick={saveKey}>{keySaved ? <><Check /> Saved</> : 'Save key'}</button>
            </div>
          </>
        )}
      </div>

      <div className="section-title">Your details (used in documents)</div>
      <div className="card grid-2">
        <div className="field"><label>Your name</label><input className="input" value={settings.profile.name} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))} /></div>
        <div className="field"><label>Person causing harm</label><input className="input" value={settings.profile.respondent} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, respondent: e.target.value } }))} /></div>
        <div className="field"><label>Relationship</label><input className="input" value={settings.profile.relationship} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, relationship: e.target.value } }))} /></div>
        <div className="field"><label>Children</label><input className="input" value={settings.profile.children} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, children: e.target.value } }))} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label>Jurisdiction</label><input className="input" value={settings.jurisdiction} onChange={(e) => setSettings({ jurisdiction: e.target.value })} /></div>
      </div>

      <div className="section-title">Safety</div>
      <div className="card stack">
        <div className="field"><label className="row" style={{ gap: 6 }}><Exit style={{ width: 16, height: 16 }} /> Exit button goes to</label><input className="input" value={settings.exitUrl} onChange={(e) => setSettings({ exitUrl: e.target.value })} /></div>
        <div className="notice"><Shield />Everything you capture stays on this phone. Nothing is uploaded unless you tap Analyze or Generate (which sends that text to Claude) or Share.</div>
        <button className="btn btn-danger" onClick={() => setConfirmWipe(true)}><Trash /> Delete all Haven data on this phone</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setSettings({ installDismissed: false }); navigate('/') }}>Show the install banner again</button>
      </div>

      <div className="tiny" style={{ textAlign: 'center', padding: '8px 0 20px' }}>Haven · prototype · not legal advice · {status.commit ? `build ${status.commit}` : ''}</div>

      <Sheet open={confirmWipe} onClose={() => setConfirmWipe(false)} title="Delete everything?">
        <p className="muted">All evidence, drafts, and settings on this phone will be erased. This cannot be undone.</p>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={() => setConfirmWipe(false)}>Keep</button>
          <button className="btn btn-danger" onClick={wipe}>{wiped ? 'Deleted' : 'Delete all'}</button>
        </div>
      </Sheet>
    </>
  )
}
