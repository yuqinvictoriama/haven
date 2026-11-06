import { useCallback, useEffect, useRef, useState } from 'react'
import { useRoute, navigate } from '../lib/router.js'
import { db, newItem, loadSettings } from '../lib/db.js'
import { pickMime, supportsRecorder, requestMedia, stopStream, fmtDuration, getLocation, toLocalInput, fmtDate } from '../lib/media.js'
import { Mic, Camera, Video, Note, Stop, Alert, Upload } from '../components/Icons.jsx'

const MODES = [
  { id: 'audio', label: 'Audio', Icon: Mic },
  { id: 'video', label: 'Video', Icon: Video },
  { id: 'photo', label: 'Photo', Icon: Camera },
  { id: 'note', label: 'Note', Icon: Note },
]

export default function Capture() {
  const { query } = useRoute()
  const mode = MODES.some((m) => m.id === query.get('mode')) ? query.get('mode') : 'audio'
  const auto = query.get('auto') === '1'
  return (
    <>
      <div className="seg">
        {MODES.map(({ id, label, Icon }) => (
          <button key={id} className={mode === id ? 'active' : ''} onClick={() => navigate(`/capture?mode=${id}`, { replace: true })}>
            <Icon /> {label}
          </button>
        ))}
      </div>
      {mode === 'audio' && <Recorder key="audio" kind="audio" auto={auto} />}
      {mode === 'video' && <Recorder key="video" kind="video" auto={auto} />}
      {mode === 'photo' && <Photo key="photo" />}
      {mode === 'note' && <NoteEditor key="note" />}
    </>
  )
}

// Shared "save this capture" form. Saves to IndexedDB and opens the item.
export function SaveForm({ kind, defaultTitle, blob, mime, text, durationSec, onDiscard, children }) {
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState(() => toLocalInput(new Date().toISOString()))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    setSaving(true)
    setErr('')
    try {
      const s = loadSettings()
      const loc = s.locationTag ? await getLocation() : null
      const item = newItem({
        kind,
        title: title.trim() || defaultTitle,
        capturedAt: new Date(when).toISOString(),
        mime: mime || '',
        size: blob ? blob.size : (text || '').length,
        blob: blob || null,
        text: text ?? null,
        durationSec: durationSec ?? null,
        notes: notes.trim(),
        location: loc,
      })
      await db.put(item)
      navigate(`/evidence/${item.id}`, { replace: true })
    } catch (e) {
      setErr('Could not save: ' + (e?.message || e))
      setSaving(false)
    }
  }
  return (
    <div className="card stack">
      {children}
      <div className="field"><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} /></div>
      <div className="field"><label>When did this happen?</label><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
      <div className="field"><label>Notes (who, where, what led up to it)</label><textarea className="textarea" style={{ minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {err && <div className="notice danger"><Alert />{err}</div>}
      <div className="btn-row">
        <button className="btn btn-outline" onClick={onDiscard} disabled={saving}>Discard</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save to evidence'}</button>
      </div>
    </div>
  )
}

function Recorder({ kind, auto }) {
  const [state, setState] = useState('idle') // idle | starting | recording | done
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const streamRef = useRef(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startRef = useRef(0)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(rafRef.current)
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    stopStream(streamRef.current)
    streamRef.current = null
    setLevel(0)
  }, [])

  const start = useCallback(async () => {
    setError('')
    setState('starting')
    try {
      const constraints = kind === 'video' ? { video: { facingMode: 'environment' }, audio: true } : { audio: true }
      const stream = await requestMedia(constraints)
      streamRef.current = stream
      if (kind === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play?.().catch(() => {})
      }
      const mime = pickMime(kind)
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const type = rec.mimeType || mime || (kind === 'video' ? 'video/webm' : 'audio/webm')
        const blob = new Blob(chunksRef.current, { type })
        const duration = (Date.now() - startRef.current) / 1000
        setResult({ blob, url: URL.createObjectURL(blob), duration, mime: type })
        setState('done')
        cleanup()
      }
      rec.onerror = (e) => {
        setError('Recording failed: ' + (e.error?.message || 'unknown error'))
        setState('idle')
        cleanup()
      }
      recRef.current = rec
      rec.start(1000)
      startRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 250)
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC) {
          const ctx = new AC()
          audioCtxRef.current = ctx
          const src = ctx.createMediaStreamSource(stream)
          const an = ctx.createAnalyser()
          an.fftSize = 512
          src.connect(an)
          const buf = new Uint8Array(an.frequencyBinCount)
          const tick = () => {
            an.getByteTimeDomainData(buf)
            let sum = 0
            for (let i = 0; i < buf.length; i++) {
              const d = (buf[i] - 128) / 128
              sum += d * d
            }
            setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4))
            rafRef.current = requestAnimationFrame(tick)
          }
          tick()
        }
      } catch {
        /* level meter is optional */
      }
      setState('recording')
    } catch (e) {
      setState('idle')
      cleanup()
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') setError(`${kind === 'video' ? 'Camera or microphone' : 'Microphone'} access was blocked. Allow it for Haven in your phone's settings, then try again.`)
      else if (e?.name === 'NotFoundError') setError('No microphone or camera was found on this device.')
      else setError('Could not start recording: ' + (e?.message || e))
    }
  }, [kind, cleanup])

  const stop = useCallback(() => {
    const r = recRef.current
    if (r && r.state !== 'inactive') r.stop()
    else {
      setState('idle')
      cleanup()
    }
  }, [cleanup])

  useEffect(() => {
    if (auto && supportsRecorder) {
      navigate(`/capture?mode=${kind}`, { replace: true })
      start()
    }
    return () => {
      const r = recRef.current
      if (r && r.state !== 'inactive') {
        try { r.stop() } catch { /* already stopped */ }
      }
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setResult({ blob: f, url: URL.createObjectURL(f), duration: null, mime: f.type })
    setState('done')
  }

  const recording = state === 'recording'
  const label = kind === 'video' ? 'Video' : 'Recording'

  if (state === 'done' && result) {
    return (
      <SaveForm kind={kind} defaultTitle={`${label} — ${fmtDate(new Date().toISOString())}`} blob={result.blob} mime={result.mime} durationSec={result.duration ? Math.round(result.duration) : null} onDiscard={() => { setResult(null); setState('idle') }}>
        {kind === 'video' ? <video className="media-preview" src={result.url} controls playsInline /> : <audio src={result.url} controls />}
        {result.duration ? <div className="muted small">Length {fmtDuration(result.duration)} · {result.mime}</div> : null}
      </SaveForm>
    )
  }

  return (
    <div className="card">
      {kind === 'video' && (
        <video ref={videoRef} className="preview-video" muted playsInline autoPlay style={{ display: recording || state === 'starting' ? 'block' : 'none', marginBottom: 12 }} />
      )}
      <div className="rec-wrap">
        <div className={'timer' + (recording ? ' on' : '')}>{fmtDuration(elapsed)}</div>
        {supportsRecorder ? (
          <button className={'rec-btn' + (recording ? ' on' : '')} onClick={recording ? stop : start} disabled={state === 'starting'} aria-label={recording ? 'Stop recording' : 'Start recording'}>
            {recording ? <Stop /> : kind === 'video' ? <Video /> : <Mic />}
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => fileRef.current?.click()}><Upload /> Record with system app</button>
        )}
        <div className="muted small">{state === 'starting' ? 'Asking for permission…' : recording ? `Recording ${kind}. Tap to stop.` : `Tap to start ${kind === 'video' ? 'a video' : 'an audio'} recording.`}</div>
        {kind === 'audio' && <div className="level"><div style={{ width: `${Math.round(level * 100)}%` }} /></div>}
      </div>
      {error && <div className="notice danger" style={{ marginTop: 8 }}><Alert />{error}</div>}
      {!recording && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Or pick an existing {kind} file</button>
          <input ref={fileRef} className="file-hidden" type="file" accept={kind === 'video' ? 'video/*' : 'audio/*'} capture onChange={onFile} />
        </div>
      )}
      <div className="tiny" style={{ marginTop: 10, textAlign: 'center' }}>Recording stops if you switch apps or lock the screen. Everything is saved only on this phone.</div>
    </div>
  )
}

function Photo() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [camOn, setCamOn] = useState(false)
  const [shot, setShot] = useState(null)
  const [error, setError] = useState('')
  const [facing, setFacing] = useState('environment')

  const stopCam = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    setCamOn(false)
  }, [])

  const openCam = useCallback(async (mode = facing) => {
    setError('')
    stopStream(streamRef.current)
    try {
      const s = await requestMedia({ video: { facingMode: mode } })
      streamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play?.().catch(() => {})
      }
      setCamOn(true)
    } catch (e) {
      setCamOn(false)
      setError(e?.name === 'NotAllowedError' ? "Camera access was blocked. Allow it for Haven in your phone's settings, or use the system camera below." : 'Could not open the camera: ' + (e?.message || e))
    }
  }, [facing])

  useEffect(() => () => stopStream(streamRef.current), [])

  const snap = () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c || !v.videoWidth) return
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob((b) => {
      if (!b) return
      setShot({ blob: b, url: URL.createObjectURL(b) })
      stopCam()
    }, 'image/jpeg', 0.92)
  }
  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setShot({ blob: f, url: URL.createObjectURL(f) })
      stopCam()
    }
  }
  const flip = () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    openCam(next)
  }

  if (shot) {
    return (
      <SaveForm kind="photo" defaultTitle={`Photo — ${fmtDate(new Date().toISOString())}`} blob={shot.blob} mime={shot.blob.type || 'image/jpeg'} onDiscard={() => setShot(null)}>
        <img className="preview-img" src={shot.url} alt="Captured" />
      </SaveForm>
    )
  }
  return (
    <div className="card stack">
      <video ref={videoRef} className="preview-video" muted playsInline autoPlay style={{ display: camOn ? 'block' : 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!camOn ? (
        <div className="rec-wrap">
          <button className="rec-btn" onClick={() => openCam()} aria-label="Open camera"><Camera /></button>
          <div className="muted small">Tap to open the camera inside Haven.</div>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn btn-outline" onClick={flip}>Flip</button>
          <button className="btn btn-primary btn-lg" onClick={snap}><Camera /> Take photo</button>
          <button className="btn btn-outline" onClick={stopCam}>Close</button>
        </div>
      )}
      {error && <div className="notice danger"><Alert />{error}</div>}
      <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}><Upload /> Use the system camera or photo library</button>
      <input ref={fileRef} className="file-hidden" type="file" accept="image/*" capture="environment" onChange={onFile} />
      <div className="tiny" style={{ textAlign: 'center' }}>Photos of injuries: include a date reference and take several from different distances.</div>
    </div>
  )
}

function NoteEditor() {
  const [text, setText] = useState('')
  return (
    <SaveForm kind="note" defaultTitle={`Note — ${fmtDate(new Date().toISOString())}`} text={text} onDiscard={() => navigate('/home')}>
      <div className="field">
        <label>What happened?</label>
        <textarea className="textarea" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Write it down while it is fresh: what was said or done, who was there, injuries, what time it started and ended." />
      </div>
    </SaveForm>
  )
}
