import { useEffect, useMemo, useRef, useState } from 'react'
import { useRoute, navigate } from '../lib/router.js'
import { db, newItem, kindForFile, KINDS } from '../lib/db.js'
import { readText, fmtDate } from '../lib/media.js'
import { Upload, Msg, ChevR, Folder, Alert, kindIcon } from '../components/Icons.jsx'

export default function Evidence() {
  const { query } = useRoute()
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)
  const highlightUpload = query.get('upload') === '1'

  const load = () => db.all().then(setItems).catch((e) => setErr(String(e?.message || e)))
  useEffect(() => { load() }, [])

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setErr('')
    try {
      for (const f of files) {
        const kind = kindForFile(f)
        const textLike = kind === 'text' || kind === 'log'
        let text = null
        if (textLike) {
          try { text = await readText(f) } catch { text = null }
        }
        const item = newItem({
          kind,
          title: f.name.replace(/\.[^.]+$/, '') || KINDS[kind].label,
          capturedAt: f.lastModified ? new Date(f.lastModified).toISOString() : new Date().toISOString(),
          mime: f.type || '',
          size: f.size,
          blob: f,
          text,
          source: 'upload',
        })
        await db.put(item)
      }
      await load()
      if (highlightUpload) navigate('/evidence', { replace: true })
    } catch (e2) {
      setErr('Upload failed: ' + (e2?.message || e2))
    } finally {
      setBusy(false)
    }
  }

  const kindsPresent = useMemo(() => Array.from(new Set((items || []).map((i) => i.kind))), [items])
  const visible = useMemo(() => (items || []).filter((i) => filter === 'all' || i.kind === filter), [items, filter])
  const groups = useMemo(() => {
    const g = []
    for (const it of visible) {
      const key = new Date(it.capturedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      let grp = g[g.length - 1]
      if (!grp || grp.key !== key) {
        grp = { key, items: [], incidents: 0 }
        g.push(grp)
      }
      grp.items.push(it)
      grp.incidents += it.analysis?.incidents?.length || 0
    }
    return g
  }, [visible])
  const incidents = (items || []).reduce((n, i) => n + (i.analysis?.incidents?.length || 0), 0)

  return (
    <>
      <div className="btn-row">
        <button className={'btn ' + (highlightUpload ? 'btn-primary' : 'btn-secondary')} onClick={() => fileRef.current?.click()} disabled={busy}><Upload /> {busy ? 'Adding…' : 'Upload files'}</button>
        <button className="btn btn-outline" onClick={() => navigate('/analyze')}><Msg /> Paste texts</button>
      </div>
      <input ref={fileRef} className="file-hidden" type="file" multiple accept="image/*,audio/*,video/*,text/*,.txt,.log,.csv,.json,.md,.eml,.pdf" onChange={onFiles} />
      {highlightUpload && <div className="notice purple">Screenshots, chat exports, call logs, photos, voice memos, and videos all work. Files keep their original date.</div>}
      {err && <div className="notice danger"><Alert />{err}</div>}

      {items && items.length > 0 && (
        <>
          <div className="row between">
            <div className="small muted">{items.length} item{items.length === 1 ? '' : 's'}{incidents ? ` · ${incidents} incidents identified` : ''}</div>
          </div>
          <div className="chips scroll">
            <button className={'chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</button>
            {kindsPresent.map((k) => (
              <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{KINDS[k]?.plural || k}</button>
            ))}
          </div>
        </>
      )}

      {items === null ? (
        <div className="empty"><span className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card empty">
          <Folder />
          <div style={{ fontWeight: 650, color: 'var(--text)' }}>Nothing here yet</div>
          <div className="small">Record, photograph, write a note, paste texts, or upload files. Everything stays on this device.</div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div className="month-head"><span className="m">{g.key}</span><span className="c">{g.items.length} item{g.items.length === 1 ? '' : 's'}{g.incidents ? ` · ${g.incidents} incidents` : ''}</span></div>
            <div className="list">
              {g.items.map((it) => (
                <button key={it.id} className="list-item" onClick={() => navigate(`/evidence/${it.id}`)}>
                  <span className={'ico' + (['audio', 'video'].includes(it.kind) ? ' yellow' : '')}>{kindIcon(it.kind)}</span>
                  <span className="meta">
                    <span className="t">{it.title || '(untitled)'}</span>
                    <span className="s">{KINDS[it.kind]?.label || it.kind} · {fmtDate(it.capturedAt)}{it.analysis ? ` · ${it.analysis.incidents?.length || 0} incidents` : ''}</span>
                  </span>
                  <ChevR className="chev" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  )
}
