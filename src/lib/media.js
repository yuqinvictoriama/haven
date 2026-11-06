// Media capture helpers: MIME negotiation, permissions, recording.

export function pickMime(kind) {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates =
    kind === 'video'
      ? ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  // Prefer mp4 on Apple devices (Safari), webm elsewhere.
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent)
  const ordered = apple ? candidates : candidates.filter((c) => !c.startsWith(kind + '/mp4')).concat(candidates.filter((c) => c.startsWith(kind + '/mp4')))
  return ordered.find((c) => MediaRecorder.isTypeSupported(c)) || ''
}

export function extFor(mime) {
  if (!mime) return 'bin'
  if (mime.includes('mp4')) return mime.startsWith('audio') ? 'm4a' : 'mp4'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('wav')) return 'wav'
  return mime.split('/')[1] || 'bin'
}

export const supportsRecorder = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
export const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isAndroid = /Android/.test(navigator.userAgent)
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export async function permissionState(name) {
  try {
    if (!navigator.permissions?.query) return 'unknown'
    const r = await navigator.permissions.query({ name })
    return r.state // granted | denied | prompt
  } catch {
    return 'unknown'
  }
}

export async function requestMedia(constraints) {
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  return stream
}

export function stopStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((t) => t.stop())
}

export async function requestMotionPermission() {
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const r = await DeviceMotionEvent.requestPermission()
      return r === 'granted'
    }
    return typeof DeviceMotionEvent !== 'undefined'
  } catch {
    return false
  }
}

export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 },
    )
  })
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function fmtBytes(n) {
  if (!n) return ''
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export function fmtDate(iso, opts) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, opts || { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function fmtDay(iso) {
  return fmtDate(iso, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function toLocalInput(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export function readText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsText(file)
  })
}

export function download(name, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function shareFiles(files, text) {
  if (navigator.canShare && navigator.canShare({ files })) {
    await navigator.share({ files, text })
    return true
  }
  if (navigator.share && text) {
    await navigator.share({ text })
    return true
  }
  return false
}
