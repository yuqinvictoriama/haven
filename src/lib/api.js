import { loadSettings } from './db.js'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code || `HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const key = loadSettings().apiKey?.trim()
  if (key) h['x-haven-key'] = key
  return h
}

async function readError(res) {
  let body = null
  try { body = await res.json() } catch { /* not json */ }
  console.error('Haven API error', res.status, body)
  return new ApiError(res.status, body?.error || 'error', body?.message || `Request failed (${res.status})`)
}

export async function health() {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' })
    if (!r.ok) return { ok: false }
    return await r.json()
  } catch {
    return { ok: false }
  }
}

// Returns the structured analysis. Throws ApiError with code 'no_api_key' when Claude is not configured.
export async function analyze({ text, source, context, images }) {
  const res = await fetch('/api/parse', { method: 'POST', headers: headers(), body: JSON.stringify({ text, source, context, images }) })
  if (!res.ok) throw await readError(res)
  return res.json()
}

// Streams Markdown. onChunk(partialText) is called as text arrives. Resolves to the full text.
export async function generate(payload, onChunk, signal) {
  const res = await fetch('/api/generate', { method: 'POST', headers: headers(), body: JSON.stringify({ ...payload, stream: true }), signal })
  if (!res.ok) throw await readError(res)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const j = await res.json()
    onChunk?.(j.markdown || '')
    return j.markdown || ''
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let full = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    full += dec.decode(value, { stream: true })
    onChunk?.(full)
  }
  full += dec.decode()
  onChunk?.(full)
  return full
}

export const isNoKey = (e) => e instanceof ApiError && e.code === 'no_api_key'
