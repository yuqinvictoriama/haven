import { useEffect, useState } from 'react'
import { navigate } from '../lib/router.js'
import { db, KINDS } from '../lib/db.js'
import { fmtDate, fmtBytes, fmtDuration, toLocalInput, blobToBase64, extFor, download, shareFiles } from '../lib/media.js'
import { analyze, isNoKey } from '../lib/api.js'
import { DEMO_ANALYSIS, SAMPLE_TEXT, heuristicAnalysis } from '../lib/demo.js'
import { useApp } from '../App.jsx'
import AnalysisView from '../components/AnalysisView.jsx'
import Sheet from '../components/Sheet.jsx'
import { Spark, Share, Download, Trash, Alert, Check, Pin } from '../components/Icons.jsx'

const ANALYZABLE = ['text', 'log', 'note', 'screenshot', 'photo']

export default function EvidenceDetail({ id }) {
  const { claudeMode } = useApp()
  const [item, setItem] = useState(undefined)
  const [url, setUrl] = useState('')
  const [edit, setEdit] = useState({ title: '', when: '', notes: '', tags: '' })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    let objUrl = ''
    db.get(id).then((it) => {
      setItem(it || null)
      if (it) {
        setEdit({ title: it.title || '', when: toLocalInput(it.capturedAt), notes: it.notes || '', tags: (it.tags || []).join(', ') })
        if (it.blob) {
          objUrl = URL.createObjectURL(it.blob)
          setUrl(objUrl)
        }
      }
    })
    return () => { if (objUrl) URL.revokeObjectURL(objUrl) }
  }, [id])

  const change = (k, v) => { setEdit((e) => ({ ...e, [k]: v })); setDirty(true); setSaved(false) }

  const save = async () => {
    const next = { ...item, title: edit.title.trim(), capturedAt: new Date(edit.when).toISOString(), notes: edit.notes.trim(), tags: edit.tags.split(',').map((t) => t.trim()).filter(Boolean) }
    await db.put(next)
    setItem(next)
    setDirty(false)
    setSaved(true)
  }

  const runAnalysis = async () => {
    setBusy(true)
    setErr('')
    try {
      let result
      const isImage = item.kind === 'screenshot' || item.kind === 'photo'
      const text = isImage ? '' : item.text || ''
      const images = isImage && item.blob ? [{ media_type: item.mime || 'image/jpeg', data: await blobToBase64(item.blob) }] : []
      const context = [item.title, item.notes].filter(Boolean).join('. ')
      try {
        result = await analyze({ text, source: item.kind === 'log' ? 'log' : 'other', context, images })
      } catch (e) {
        if (isNoKey(e)) result = text.trim() === SAMPLE_TEXT.trim() ? DEMO_ANALYSIS : heuristicAnalysis(text || `[${KINDS[item.kind].label}: ${item.title}] ${item.notes || ''}`)
        else throw e
      }
      const next = { ...item, analysis: result }
      await db.put(next)
      setItem(next)
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const fileName = () => `${(item.title || item.kind).replace(/[^\w.-]+/g, '_').slice(0, 60)}.${item.blob ? extFor(item.mime || item.blob.type) : 'txt'}`
  const doDownload = () => download(fileName(), item.blob || new Blob([item.text || ''], { type: 'text/plain' }))
  const doShare = async () => {
    try {
      const blob = item.blob || new Blob([item.text || ''], { type: 'text/plain' })
      const f = new File([blob], fileName(), { type: blob.type || 'application/octet-stream' })
      const ok = await shareFiles([f], `${item.title} (${fmtDate(item.capturedAt)})`)
      if (!ok) doDownload()
    } catch (e) {
      if (e?.name !== 'AbortError') setErr('Share failed: ' + (e?.message || e))
    }
  }
  const doDelete = async () => {
    await db.delete(item.id)
    navigate('/evidence', { replace: true })
  }

  if (item === undefined) return <div className="empty"><span className="spinner" /></div>
  if (item === null) return <div className="card empty">This item no longer exists.</div>

  const isText = ['text', 'log', 'note'].includes(item.kind)
  const canAnalyze = ANALYZABLE.includes(item.kind) && (isText ? !!item.text : !!item.blob)

  return (
    <>
      <div className="row between">
        <span className="badge purple">{KINDS[item.kind]?.label || item.kind}</span>
        <span className="tiny">{fmtBytes(item.size)}{item.durationSec ? ` · ${fmtDuration(item.durationSec)}` : ''}{item.location ? ' · location tagged' : ''}</span>
      </div>

      {item.blob && (item.kind === 'photo' || item.kind === 'screenshot') && <img className="preview-img" src={url} alt={item.title} />}
      {item.blob && item.kind === 'audio' && <audio src={url} controls />}
      {item.blob && item.kind === 'video' && <video className="media-preview" src={url} controls playsInline />}
      {isText && item.text != null && (
        <div className="card card-tight">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--sans)', fontSize: '0.9rem', maxHeight: showText ? 'none' : 160, overflow: 'hidden' }}>{item.text}</pre>
          {item.text.length > 400 && <button className="btn btn-ghost btn-sm" onClick={() => setShowText(!showText)}>{showText ? 'Show less' : 'Show all'}</button>}
        </div>
      )}
      {item.blob && item.kind === 'file' && <div className="notice">Stored file: {item.mime || 'unknown type'}. Download to view.</div>}

      <div className="card stack">
        <div className="field"><label>Title</label><input className="input" value={edit.title} onChange={(e) => change('title', e.target.value)} /></div>
        <div className="field"><label>When it happened</label><input className="input" type="datetime-local" value={edit.when} onChange={(e) => change('when', e.target.value)} /></div>
        <div className="field"><label>Notes</label><textarea className="textarea" style={{ minHeight: 80 }} value={edit.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Context: who, where, what led up to it, injuries, witnesses." /></div>
        <div className="field"><label>Tags (comma separated)</label><input className="input" value={edit.tags} onChange={(e) => change('tags', e.target.value)} placeholder="threat, custody, work" /></div>
        {item.location && <div className="tiny row"><Pin style={{ width: 14, height: 14 }} /> {item.location.lat}, {item.location.lng} (±{item.location.accuracy} m)</div>}
        <div className="row between">
          <span className="tiny">Added {fmtDate(item.createdAt)}</span>
          <button className="btn btn-sm btn-primary" onClick={save} disabled={!dirty}>{saved ? <><Check /> Saved</> : 'Save changes'}</button>
        </div>
      </div>

      {canAnalyze && (
        <button className="btn btn-secondary btn-lg btn-block" onClick={runAnalysis} disabled={busy}>
          {busy ? <><span className="spinner" /> Analyzing with Claude…</> : <><Spark /> {item.analysis ? 'Re-analyze with Claude' : 'Analyze with Claude'}</>}
        </button>
      )}
      {canAnalyze && claudeMode === 'demo' && !item.analysis && <div className="tiny" style={{ textAlign: 'center' }}>Claude is in demo mode. Add a key in More → Claude for real analysis.</div>}
      {err && <div className="notice danger"><Alert />{err}</div>}
      {item.analysis && <AnalysisView a={item.analysis} />}

      <div className="btn-row no-print">
        <button className="btn btn-outline" onClick={doShare}><Share /> Share</button>
        <button className="btn btn-outline" onClick={doDownload}><Download /> Download</button>
        <button className="btn btn-danger" onClick={() => setConfirmDel(true)}><Trash /> Delete</button>
      </div>

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete this item?">
        <p className="muted">This removes it from this phone permanently. There is no undo.</p>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={() => setConfirmDel(false)}>Keep</button>
          <button className="btn btn-danger" onClick={doDelete}>Delete</button>
        </div>
      </Sheet>
    </>
  )
}
