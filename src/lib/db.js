// IndexedDB storage. Everything stays on the device until the user shares it.
const DB_NAME = 'haven'
const DB_VERSION = 1

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('evidence')) {
        const s = db.createObjectStore('evidence', { keyPath: 'id' })
        s.createIndex('capturedAt', 'capturedAt')
      }
      if (!db.objectStoreNames.contains('documents')) {
        const d = db.createObjectStore('documents', { keyPath: 'id' })
        d.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode)
        const s = t.objectStore(store)
        const r = fn(s)
        t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined)
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
      }),
  )
}

export function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 20)
}

export const KINDS = {
  audio: { label: 'Recording', plural: 'Recordings' },
  video: { label: 'Video', plural: 'Videos' },
  photo: { label: 'Photo', plural: 'Photos' },
  screenshot: { label: 'Screenshot', plural: 'Screenshots' },
  text: { label: 'Texts', plural: 'Texts' },
  log: { label: 'Log', plural: 'Logs' },
  note: { label: 'Note', plural: 'Notes' },
  file: { label: 'File', plural: 'Files' },
}

export function kindForFile(file) {
  const t = file.type || ''
  const n = (file.name || '').toLowerCase()
  if (t.startsWith('image/')) return /screen|shot|img_|capture/.test(n) ? 'screenshot' : 'photo'
  if (t.startsWith('audio/')) return 'audio'
  if (t.startsWith('video/')) return 'video'
  if (/\.(log|csv)$/.test(n)) return 'log'
  if (t.startsWith('text/') || /\.(txt|md|json|vcf|eml)$/.test(n)) return 'text'
  return 'file'
}

export function newItem(partial) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    kind: 'note',
    title: '',
    capturedAt: now,
    createdAt: now,
    mime: '',
    size: 0,
    blob: null,
    text: null,
    notes: '',
    tags: [],
    source: '',
    analysis: null,
    durationSec: null,
    location: null,
    ...partial,
  }
}

export const db = {
  all: () => tx('evidence', 'readonly', (s) => s.getAll()).then((r) => (r || []).sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))),
  get: (id) => tx('evidence', 'readonly', (s) => s.get(id)),
  put: (item) => tx('evidence', 'readwrite', (s) => s.put(item)).then(() => item),
  delete: (id) => tx('evidence', 'readwrite', (s) => s.delete(id)),
  clear: () => Promise.all([tx('evidence', 'readwrite', (s) => s.clear()), tx('documents', 'readwrite', (s) => s.clear())]),
  docs: () => tx('documents', 'readonly', (s) => s.getAll()).then((r) => (r || []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))),
  getDoc: (id) => tx('documents', 'readonly', (s) => s.get(id)),
  putDoc: (doc) => tx('documents', 'readwrite', (s) => s.put(doc)).then(() => doc),
  deleteDoc: (id) => tx('documents', 'readwrite', (s) => s.delete(id)),
}

// Settings live in localStorage (small, synchronous).
const SETTINGS_KEY = 'haven.settings'
const defaults = {
  apiKey: '',
  shake: false,
  locationTag: false,
  jurisdiction: 'California',
  profile: { name: '', respondent: '', relationship: '', children: '', notes: '' },
  installDismissed: false,
}
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaults }
    const s = JSON.parse(raw)
    return { ...defaults, ...s, profile: { ...defaults.profile, ...(s.profile || {}) } }
  } catch {
    return { ...defaults }
  }
}
export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable (private mode) */
  }
}
