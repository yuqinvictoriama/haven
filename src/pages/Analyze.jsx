import { useEffect, useState } from 'react'
import { useRoute, navigate } from '../lib/router.js'
import { db, newItem } from '../lib/db.js'
import { analyze, isNoKey } from '../lib/api.js'
import { SAMPLE_TEXT, DEMO_ANALYSIS, heuristicAnalysis } from '../lib/demo.js'
import { useApp } from '../App.jsx'
import AnalysisView from '../components/AnalysisView.jsx'
import { Spark, Alert, Check } from '../components/Icons.jsx'

// "Add log": type what happened in your own words, or paste messages or a log. Screenshots are added on the Evidence page.
const SOURCES = [
  ['note', 'My own account'], ['sms', 'Text messages (SMS)'], ['imessage', 'iMessage'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['social', 'Social media / DMs'], ['log', 'Call log / other log'], ['other', 'Other'],
]

// Her own account is saved as a note (her words); pasted logs as a log; everything else as texts.
const kindForSource = (source) => (source === 'note' ? 'note' : source === 'log' ? 'log' : 'text')

export default function Analyze({ shared = false }) {
  const { query } = useRoute()
  const { claudeMode } = useApp()
  const [text, setText] = useState(() => (shared ? [query.get('title'), query.get('text'), query.get('url')].filter(Boolean).join('\n') : ''))
  const [source, setSource] = useState(shared ? 'sms' : 'note')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [demo, setDemo] = useState(false)
  const [savedId, setSavedId] = useState('')

  useEffect(() => {
    if (shared) navigate('/analyze', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async () => {
    if (!text.trim()) return
    setBusy(true)
    setErr('')
    setResult(null)
    setSavedId('')
    setDemo(false)
    try {
      try {
        const r = await analyze({ text, source, context, images: [] })
        setResult(r)
      } catch (e) {
        if (isNoKey(e)) {
          setDemo(true)
          setResult(text.trim() === SAMPLE_TEXT.trim() ? DEMO_ANALYSIS : heuristicAnalysis(text))
        } else throw e
      }
    } catch (e) {
      console.error('Add log analysis failed', e)
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const saveToEvidence = async () => {
    const firstDate = result?.incidents?.find((i) => i.date)?.date
    const capturedAt = firstDate ? new Date(firstDate + 'T12:00:00').toISOString() : new Date().toISOString()
    const item = newItem({ kind: kindForSource(source), title: `${SOURCES.find((s) => s[0] === source)?.[1] || 'Log'} — ${result?.incidents?.length || 0} incidents`, capturedAt, text, source, analysis: result, notes: context })
    await db.put(item)
    setSavedId(item.id)
  }

  return (
    <>
      <div className="notice purple"><Spark />Write what happened in your own words, or paste a message thread, chat export, or call log. Claude pulls out each incident with a verbatim quote, dates it, and finds the patterns. To add screenshots, use Upload screenshot on the Evidence page.</div>
      <div className="card stack">
        <div className="field">
          <label>Your log</label>
          <textarea className="textarea mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={'Write what happened, with the date if you know it, e.g.\nNov 3, 2026 — He took my phone and...\n\nOr paste messages, e.g.\nMar 3, 2026 7:05 AM — J: ...'} />
          <div className="row between">
            <button className="btn btn-ghost btn-sm" onClick={() => { setText(SAMPLE_TEXT); setSource('imessage') }}>Use a sample thread</button>
            <span className="tiny">{text.length.toLocaleString()} chars</span>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Source</label><select className="select" value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="field"><label>Who is who (optional)</label><input className="input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="J is my ex; Ava is our daughter" /></div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy || !text.trim()}>
          {busy ? <><span className="spinner" /> Analyzing with Claude…</> : <><Spark /> Analyze with Claude</>}
        </button>
        {claudeMode === 'demo' && <div className="tiny" style={{ textAlign: 'center' }}>Demo mode: the sample thread returns a full analysis; other text gets a keyword-based preview. Add a key in More → Claude for the real thing.</div>}
      </div>
      {err && <div className="notice danger"><Alert />{err}</div>}
      {demo && result && <div className="notice warn"><Alert />Demo analysis. Connect Claude for real results.</div>}
      {result && (
        <>
          <AnalysisView a={result} />
          {savedId ? (
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => navigate(`/evidence/${savedId}`)}><Check /> Saved · open</button>
              <button className="btn btn-primary" onClick={() => navigate('/generate')}>Generate documents</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-lg btn-block" onClick={saveToEvidence}>Save to evidence</button>
          )}
        </>
      )}
    </>
  )
}
