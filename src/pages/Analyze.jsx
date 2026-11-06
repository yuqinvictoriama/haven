import { useEffect, useRef, useState } from 'react'
import { useRoute, navigate } from '../lib/router.js'
import { db, newItem } from '../lib/db.js'
import { blobToBase64 } from '../lib/media.js'
import { analyze, isNoKey } from '../lib/api.js'
import { SAMPLE_TEXT, DEMO_ANALYSIS, heuristicAnalysis } from '../lib/demo.js'
import { useApp } from '../App.jsx'
import AnalysisView from '../components/AnalysisView.jsx'
import { Spark, Img, Alert, Check, X } from '../components/Icons.jsx'

const SOURCES = [
  ['sms', 'Text messages (SMS)'], ['imessage', 'iMessage'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['social', 'Social media / DMs'], ['log', 'Call log / other log'], ['other', 'Other'],
]

export default function Analyze({ shared = false }) {
  const { query } = useRoute()
  const { claudeMode } = useApp()
  const [text, setText] = useState(() => (shared ? [query.get('title'), query.get('text'), query.get('url')].filter(Boolean).join('\n') : ''))
  const [source, setSource] = useState('sms')
  const [context, setContext] = useState('')
  const [images, setImages] = useState([]) // { file, url }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [demo, setDemo] = useState(false)
  const [savedId, setSavedId] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (shared) navigate('/analyze', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addImages = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/')).slice(0, 6 - images.length)
    e.target.value = ''
    setImages((im) => [...im, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))])
  }
  const removeImage = (i) => setImages((im) => im.filter((_, j) => j !== i))

  const run = async () => {
    if (!text.trim() && !images.length) return
    setBusy(true)
    setErr('')
    setResult(null)
    setSavedId('')
    setDemo(false)
    try {
      const imgs = []
      for (const im of images) imgs.push({ media_type: im.file.type, data: await blobToBase64(im.file) })
      try {
        const r = await analyze({ text, source, context, images: imgs })
        setResult(r)
      } catch (e) {
        if (isNoKey(e)) {
          setDemo(true)
          setResult(text.trim() === SAMPLE_TEXT.trim() ? DEMO_ANALYSIS : heuristicAnalysis(text || 'Screenshot (demo mode cannot read images)'))
        } else throw e
      }
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const saveToEvidence = async () => {
    const firstDate = result?.incidents?.find((i) => i.date)?.date
    const capturedAt = firstDate ? new Date(firstDate + 'T12:00:00').toISOString() : new Date().toISOString()
    let id = ''
    if (text.trim()) {
      const item = newItem({ kind: source === 'log' ? 'log' : 'text', title: `${SOURCES.find((s) => s[0] === source)?.[1] || 'Texts'} — ${result?.incidents?.length || 0} incidents`, capturedAt, text, source, analysis: result, notes: context })
      await db.put(item)
      id = item.id
    }
    for (const im of images) {
      const item = newItem({ kind: 'screenshot', title: im.file.name.replace(/\.[^.]+$/, '') || 'Screenshot', capturedAt, mime: im.file.type, size: im.file.size, blob: im.file, source, analysis: text.trim() ? null : result, notes: context })
      await db.put(item)
      if (!id) id = item.id
    }
    setSavedId(id)
  }

  return (
    <>
      <div className="notice purple"><Spark />Paste a message thread, chat export, or call log, or attach screenshots. Claude pulls out each incident with a verbatim quote, dates it, and finds the patterns.</div>
      <div className="card stack">
        <div className="field">
          <label>Messages or log</label>
          <textarea className="textarea mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={'Paste here. Include dates and who sent each message if you can, e.g.\nMar 3, 2026 7:05 AM — J: ...'} />
          <div className="row between">
            <button className="btn btn-ghost btn-sm" onClick={() => { setText(SAMPLE_TEXT); setSource('imessage') }}>Use a sample thread</button>
            <span className="tiny">{text.length.toLocaleString()} chars</span>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Source</label><select className="select" value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="field"><label>Who is who (optional)</label><input className="input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="J is my ex; Ava is our daughter" /></div>
        </div>
        <div className="field">
          <label>Screenshots (up to 6)</label>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {images.map((im, i) => (
              <span key={i} style={{ position: 'relative' }}>
                <img src={im.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button className="icon-btn" style={{ position: 'absolute', top: -10, right: -10, width: 26, height: 26, background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => removeImage(i)} aria-label="Remove"><X style={{ width: 14, height: 14 }} /></button>
              </span>
            ))}
            {images.length < 6 && <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}><Img /> Add</button>}
          </div>
          <input ref={fileRef} className="file-hidden" type="file" accept="image/*" multiple onChange={addImages} />
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy || (!text.trim() && !images.length)}>
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
