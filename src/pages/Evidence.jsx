import { useEffect, useMemo, useRef, useState } from 'react'
import { useRoute, navigate } from '../lib/router.js'
import { db, newItem, kindForFile, KINDS } from '../lib/db.js'
import { readText, fmtDate } from '../lib/media.js'
import { analyze } from '../lib/api.js'
import { Upload, ChevR, Folder, Alert, Spark, Img, Camera, Mic, Note, kindIcon } from '../components/Icons.jsx'

const SCREENSHOT_TYPES = 'image/png,image/jpeg,image/webp,image/gif'
const MAX_SIDE = 1600

// Shrink the image to a JPEG (max 1600 px) so the request stays under Vercel's body size limit.
function imageForClaude(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve({ media_type: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.85).split(',')[1] })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not open this image'))
    }
    img.src = url
  })
}

export default function Evidence() {
  const { query } = useRoute()
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [reading, setReading] = useState('')
  const [shotMsg, setShotMsg] = useState('')
  const fileRef = useRef(null)
  const shotRef = useRef(null)
  const photoRef = useRef(null)
  const recordingRef = useRef(null)
  const highlightUpload = query.get('upload') === '1'

  const load = () => db.all().then(setItems).catch((e) => setErr(String(e?.message || e)))
  useEffect(() => { load() }, [])

  // Saves picked files as evidence. "Upload photo" passes kind 'photo'; other buttons let the file type decide.
  const onFiles = (forcedKind) => async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setErr('')
    try {
      for (const f of files) {
        const kind = forcedKind || kindForFile(f)
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

  const onScreenshots = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setErr('')
    setShotMsg('')
    setReading(files.length > 1 ? 'Saving screenshots…' : 'Saving screenshot…')
    const saved = []
    try {
      for (const f of files) {
        const item = newItem({
          kind: 'screenshot',
          title: f.name.replace(/\.[^.]+$/, '') || 'Screenshot',
          capturedAt: f.lastModified ? new Date(f.lastModified).toISOString() : new Date().toISOString(),
          mime: f.type || '',
          size: f.size,
          blob: f,
          source: 'upload',
        })
        await db.put(item)
        saved.push(item)
      }
      await load()
    } catch (e2) {
      console.error('Saving screenshots failed', e2)
      setErr('Upload failed: ' + (e2?.message || e2))
      setReading('')
      return
    }
    // Read each screenshot with Claude, one at a time, and save what it finds on that item.
    let failed = 0
    for (let i = 0; i < saved.length; i++) {
      setReading(saved.length > 1 ? `Reading screenshot ${i + 1} of ${saved.length}…` : 'Reading screenshot…')
      try {
        const image = await imageForClaude(saved[i].blob)
        const analysis = await analyze({ text: '', source: 'other', context: saved[i].title, images: [image] })
        await db.put({ ...saved[i], analysis })
        await load()
      } catch (e3) {
        failed++
        console.error('Could not read screenshot', saved[i].title, e3)
      }
    }
    setReading('')
    if (failed === 1 && saved.length === 1) setShotMsg("Saved. We couldn't read this screenshot right now — you can try Analyze on its page.")
    else if (failed) setShotMsg(`Saved. We couldn't read ${failed} of ${saved.length} screenshots right now — you can try Analyze on each one's page.`)
  }

  const kindsPresent = useMemo(() => Array.from(new Set((items || []).map((i) => i.kind))), [items])
  const visible = useMemo(() => (items || []).filter((i) => filter === 'all' || i.kind === filter), [items, filter])
  const pinned = useMemo(() => visible.filter((i) => i.pinned), [visible])
  const groups = useMemo(() => {
    const g = []
    for (const it of visible.filter((i) => !i.pinned)) {
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

  const renderItem = (it) => (
    <button key={it.id} className="list-item" onClick={() => navigate(`/evidence/${it.id}`)}>
      <span className={'ico' + (['audio', 'video'].includes(it.kind) ? ' yellow' : '')}>{kindIcon(it.kind)}</span>
      <span className="meta">
        <span className="t">{it.title || '(untitled)'}</span>
        <span className="s">{KINDS[it.kind]?.label || it.kind} · {fmtDate(it.capturedAt)}{it.analysis ? ` · ${it.analysis.incidents?.length || 0} incidents` : ''}</span>
      </span>
      <ChevR className="chev" />
    </button>
  )

  return (
    <>
      <div className="section-title">Add evidence</div>
      <div className="grid-2">
        <button className="action-tile" onClick={() => photoRef.current?.click()} disabled={busy || !!reading}>
          <span className="ico"><Camera /></span>
          <span className="label">Upload photo</span>
          <span className="desc">Injuries, damage, places</span>
        </button>
        <button className="action-tile" onClick={() => recordingRef.current?.click()} disabled={busy || !!reading}>
          <span className="ico"><Mic /></span>
          <span className="label">Upload recording</span>
          <span className="desc">Voice memos or videos</span>
        </button>
        <button className="action-tile" onClick={() => shotRef.current?.click()} disabled={busy || !!reading}>
          <span className="ico yellow"><Img /></span>
          <span className="label">Upload screenshot</span>
          <span className="desc">Messages; Claude reads them</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/analyze')}>
          <span className="ico yellow"><Note /></span>
          <span className="label">Add log</span>
          <span className="desc">Type what happened or paste texts</span>
        </button>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}><Upload /> {busy ? 'Adding…' : 'Other file (PDF, email, chat export…)'}</button>
      <input ref={photoRef} className="file-hidden" type="file" multiple accept="image/*" onChange={onFiles('photo')} />
      <input ref={recordingRef} className="file-hidden" type="file" multiple accept="audio/*,video/*" onChange={onFiles(null)} />
      <input ref={shotRef} className="file-hidden" type="file" multiple accept={SCREENSHOT_TYPES} onChange={onScreenshots} />
      <input ref={fileRef} className="file-hidden" type="file" multiple accept="image/*,audio/*,video/*,text/*,.txt,.log,.csv,.json,.md,.eml,.pdf" onChange={onFiles(null)} />

      <div className="card" style={{ background: 'var(--purple-soft)', borderColor: 'transparent' }}>
        <h3>See the patterns over time</h3>
        <p className="small" style={{ margin: '4px 0 10px' }}>Claude reviews all your evidence together and shows what keeps happening, and how it has changed.</p>
        <button className="btn btn-primary btn-block" onClick={() => navigate('/review')}><Spark /> Review notes</button>
      </div>
      {highlightUpload && <div className="notice purple">Screenshots, chat exports, call logs, photos, voice memos, and videos all work. Files keep their original date.</div>}
      {reading && <div className="notice purple"><span className="spinner" />{reading}</div>}
      {shotMsg && <div className="notice warn"><Alert />{shotMsg}</div>}
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
        <>
          {pinned.length > 0 && (
            <div>
              <div className="month-head"><span className="m">Pinned</span><span className="c">{pinned.length} item{pinned.length === 1 ? '' : 's'}</span></div>
              <div className="list">{pinned.map(renderItem)}</div>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.key}>
              <div className="month-head"><span className="m">{g.key}</span><span className="c">{g.items.length} item{g.items.length === 1 ? '' : 's'}{g.incidents ? ` · ${g.incidents} incidents` : ''}</span></div>
              <div className="list">{g.items.map(renderItem)}</div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
