import { useEffect, useState } from 'react'
import { db, loadSettings } from '../lib/db.js'
import { fmtDay } from '../lib/media.js'
import { sampleEntries } from '../data/sampleEntries.js'
import { HOTLINE, DANGER_NOW, LEGAL_DISCLAIMER, SAFETY_CARD, NEXT_STEPS } from '../content/safetyText.js'
import { navigate } from '../lib/router.js'
import { Spark, Alert, Phone, Note } from '../components/Icons.jsx'

// Reviews dated notes with the collaborator's /api/analyze endpoint:
// categories per entry, safety flags, and a first-person DV-100 draft.
export default function Review() {
  const [entries, setEntries] = useState(null)
  const [sample, setSample] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    db.all().then((all) => {
      const notes = all.filter((i) => ['note', 'text', 'log'].includes(i.kind) && i.text && i.text.trim()).sort((a, b) => (a.capturedAt < b.capturedAt ? -1 : 1))
      setEntries(notes.map((it, i) => ({ n: i + 1, date: it.capturedAt.slice(0, 10), text: it.text.trim().slice(0, 4000), id: it.id })))
    })
  }, [])

  const useSample = () => {
    setSample(true)
    setResult(null)
    setErr('')
    setEntries(sampleEntries.map((e) => ({ ...e })))
  }

  const run = async () => {
    if (!entries?.length) return
    setBusy(true)
    setErr('')
    setResult(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      const key = loadSettings().apiKey?.trim()
      if (key) headers['x-haven-key'] = key
      const r = await fetch('/api/analyze', { method: 'POST', headers, body: JSON.stringify({ entries: entries.map(({ n, date, text }) => ({ n, date, text })) }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || j.message || `Request failed (${r.status})`)
      setResult(j)
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const labelsFor = (n) => result?.categories?.find((c) => c.entry === n)?.labels || []
  const flagFor = (n) => result?.safetyFlags?.find((f) => f.entry === n)
  const showSafety = (result && result.safetyFlags?.length > 0) || !!err

  return (
    <>
      <div className="notice purple"><Spark />Claude reads your dated notes in order, tags each one (physical harm, threats, isolation and control, financial control), flags serious danger signs, and drafts what happened in your own words for a DV-100.</div>

      {entries === null ? (
        <div className="empty"><span className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="card empty">
          <Note />
          <div style={{ fontWeight: 650, color: 'var(--text)' }}>No notes yet</div>
          <div className="small">Write notes in Capture, or try the sample entries.</div>
          <div className="btn-row" style={{ width: '100%' }}>
            <button className="btn btn-outline" onClick={() => navigate('/capture?mode=note')}>Write a note</button>
            <button className="btn btn-secondary" onClick={useSample}>Use 12 sample entries</button>
          </div>
        </div>
      ) : (
        <>
          <div className="row between">
            <span className="small muted">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}{sample ? ' · sample data (Serena and Marcus are made up)' : ''}</span>
            {!sample && <button className="btn btn-ghost btn-sm" onClick={useSample}>Use sample instead</button>}
          </div>
          <div className="list">
            {entries.map((e) => {
              const labels = labelsFor(e.n)
              const flag = flagFor(e.n)
              return (
                <div key={e.n} className="list-item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
                  <span className="badge purple" style={{ marginTop: 2 }}>{e.n}</span>
                  <span className="meta" style={{ whiteSpace: 'normal' }}>
                    <span className="tiny">{fmtDay(e.date + 'T12:00:00')}</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', whiteSpace: 'normal' }}>{e.text}</span>
                    {labels.length > 0 && <span className="chips" style={{ marginTop: 6 }}>{labels.map((l) => <span key={l} className="badge yellow">{l}</span>)}</span>}
                    {flag && <span className="notice danger" style={{ marginTop: 6, display: 'flex' }}><Alert />{flag.reason}</span>}
                  </span>
                </div>
              )
            })}
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy}>
            {busy ? <><span className="spinner" /> Reviewing with Claude…</> : <><Spark /> Review with Claude</>}
          </button>
        </>
      )}

      {showSafety && (
        <div className="card" style={{ background: 'var(--danger-soft)', borderColor: 'transparent' }}>
          <h3 style={{ color: 'var(--danger)' }}>{SAFETY_CARD.title}</h3>
          <p className="small" style={{ margin: '6px 0 10px' }}>{err ? SAFETY_CARD.fallbackIntro : SAFETY_CARD.intro}</p>
          <div className="btn-row">
            <a className="btn" href={HOTLINE.tel} style={{ background: 'var(--surface)' }}><Phone /> {HOTLINE.name}: {HOTLINE.phone}</a>
            <a className="btn" href={DANGER_NOW.tel} style={{ background: 'var(--surface)' }}>{DANGER_NOW.text}</a>
          </div>
        </div>
      )}
      {err && <div className="notice danger"><Alert />{err}</div>}

      {result && (
        <>
          <div className="section-title">Draft in your words (DV-100)</div>
          <div className="doc">
            {result.draft?.length ? result.draft.map((s, i) => <p key={i}>{s}</p>) : <p className="muted">No relevant events were found in these entries.</p>}
          </div>
          {result.legalLinks?.length > 0 && (
            <div className="card">
              <h3>How this may relate to California law</h3>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }} className="small">{result.legalLinks.map((l) => <li key={l.category} style={{ margin: '4px 0' }}>{l.text}</li>)}</ul>
              <p className="tiny" style={{ margin: '8px 0 0' }}>{LEGAL_DISCLAIMER}</p>
            </div>
          )}
          <div className="card">
            <h3>{NEXT_STEPS.title}</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }} className="small">{NEXT_STEPS.items.map((t, i) => <li key={i} style={{ margin: '4px 0' }}>{t}</li>)}</ul>
          </div>
          <div className="tiny" style={{ textAlign: 'center' }}>{LEGAL_DISCLAIMER}</div>
        </>
      )}
    </>
  )
}
