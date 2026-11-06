import { useEffect, useState } from 'react'
import { db, loadSettings } from '../lib/db.js'
import { fmtDay } from '../lib/media.js'
import { sampleEntries } from '../data/sampleEntries.js'
import { HOTLINE, DANGER_NOW, LEGAL_DISCLAIMER, SAFETY_CARD, NEXT_STEPS } from '../content/safetyText.js'
import { navigate } from '../lib/router.js'
import { Spark, Alert, Phone, Note } from '../components/Icons.jsx'
import { CATEGORY_NAMES } from '../../data/categories.js'

const KIND_LABEL = { note: 'Note', text: 'Text messages', log: 'Log', screenshot: 'Screenshot', photo: 'Photo', audio: 'Voice memo', video: 'Video', file: 'File' }

// What Claude reads for each saved item: her own words for notes, texts and logs;
// for photos, recordings and screenshots, the saved text, what Claude read from it, and her description.
function entryText(item) {
  const words = item.text?.trim() || ''
  if (['note', 'text', 'log'].includes(item.kind)) return words
  return [words, item.analysis?.summary?.trim(), item.notes?.trim()].filter(Boolean).join(' ')
}

// The calendar day in her own time zone (capturedAt is stored in UTC).
function localDay(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function entryRefs(numbers) {
  return `${numbers.length === 1 ? 'Entry' : 'Entries'} ${numbers.join(', ')}`
}

function dateRange(first, last) {
  if (!first) return ''
  return first === last ? fmtDay(first + 'T12:00:00') : `${fmtDay(first + 'T12:00:00')} – ${fmtDay(last + 'T12:00:00')}`
}

// Built from the categories, not written by Claude: how many entries showed each kind of abuse each month.
function monthByMonth(entries, categories) {
  const months = new Map()
  for (const entry of entries) {
    const labels = categories?.find((c) => c.entry === entry.n)?.labels || []
    if (!labels.length || !entry.date) continue
    const month = entry.date.slice(0, 7)
    const counts = months.get(month) || {}
    for (const label of labels) counts[label] = (counts[label] || 0) + 1
    months.set(month, counts)
  }
  return [...months.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
}

// Reviews all saved evidence with /api/analyze: categories per entry, safety flags,
// a short summary, and the patterns over time that can be hard to see one day at a time.
export default function Review() {
  const [entries, setEntries] = useState(null)
  const [sample, setSample] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    db.all().then((all) => {
      const usable = all.filter((it) => entryText(it)).sort((a, b) => (a.capturedAt < b.capturedAt ? -1 : 1))
      setEntries(usable.map((it, i) => ({ n: i + 1, date: localDay(it.capturedAt), kind: it.kind, text: entryText(it).slice(0, 4000), id: it.id })))
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
      const r = await fetch('/api/analyze', { method: 'POST', headers, body: JSON.stringify({ entries: entries.map(({ n, date, kind, text }) => ({ n, date, kind: kind || 'note', text })) }) })
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
      <div className="notice purple"><Spark />Claude reads all your saved evidence in date order (notes, texts, screenshots, and the descriptions of your photos and recordings), tags each one, flags serious danger signs, and shows you the patterns over time that can be hard to see one day at a time.</div>

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
                    <span className="tiny">{fmtDay(e.date + 'T12:00:00')}{e.kind && e.kind !== 'note' ? ` · ${KIND_LABEL[e.kind] || e.kind}` : ''}</span>
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
          {result.summary?.length > 0 && (
            <>
              <div className="section-title">Summary</div>
              <div className="card">
                {result.summary.map((line, i) => (
                  <p key={i} className="small" style={{ margin: '0 0 8px' }}>{line.text} <span className="tiny muted">({entryRefs(line.entries)})</span></p>
                ))}
              </div>
            </>
          )}

          <div className="section-title">Patterns over time</div>
          {result.patterns?.length ? (
            result.patterns.map((pattern, i) => (
              <div key={i} className="card">
                <h3>{pattern.name}</h3>
                <p className="small" style={{ margin: '6px 0' }}>{pattern.description}</p>
                <div className="tiny muted">{[dateRange(pattern.firstDate, pattern.lastDate), entryRefs(pattern.entries)].filter(Boolean).join(' · ')}</div>
              </div>
            ))
          ) : (
            <p className="small muted">No repeated patterns were found in these entries.</p>
          )}

          {monthByMonth(entries, result.categories).length > 0 && (
            <div className="card">
              <h3>Month by month</h3>
              <p className="tiny muted" style={{ margin: '4px 0 8px' }}>How many of your entries showed each kind of abuse, by month.</p>
              {monthByMonth(entries, result.categories).map(([month, counts]) => (
                <div key={month} style={{ margin: '8px 0' }}>
                  <div className="small" style={{ fontWeight: 650 }}>{new Date(month + '-01T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                  <span className="chips" style={{ marginTop: 4 }}>
                    {CATEGORY_NAMES.filter((label) => counts[label]).map((label) => <span key={label} className="badge yellow">{label} · {counts[label]}</span>)}
                  </span>
                </div>
              ))}
            </div>
          )}
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
