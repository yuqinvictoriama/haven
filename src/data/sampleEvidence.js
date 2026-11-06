// Load or remove made-up sample evidence (Serena and Marcus are not real people).
// The 12 sample entries become notes, plus four placeholder media items that
// match those entries and add no new events.
import { db, newItem } from '../lib/db.js'
import { sampleEntries } from './sampleEntries.js'

const SAMPLE_MEDIA = [
  {
    kind: 'photo',
    date: '2026-10-09',
    title: 'Sample: Photo of the kitchen wall',
    notes: 'Placeholder photo (sample): the hole Marcus punched in the kitchen wall.',
  },
  {
    kind: 'photo',
    date: '2026-10-29',
    title: 'Sample: Photo of bruises on my arm',
    notes: 'Placeholder photo (sample): bruises on my arm where Marcus grabbed it.',
  },
  {
    kind: 'screenshot',
    date: '2026-10-05',
    title: 'Sample: Screenshot of a text from Marcus',
    text: 'Marcus: why are you at the store so long',
    notes: 'Placeholder screenshot (sample) of a text message from Marcus.',
  },
  {
    kind: 'audio',
    date: '2026-10-17',
    title: 'Sample: Voice memo about grocery money',
    notes: "Placeholder voice memo (sample): the argument about $20 for groceries. Marcus said it's his money now, and that I'd regret it when I said I'd open my own account.",
  },
]

export const SAMPLE_PROFILE = { name: 'Serena (sample)', respondent: 'Marcus (sample)', relationship: 'dating' }

export function isSampleItem(item) {
  return item.source === 'sample'
}

// Local time on the given day, so capturedAt.slice(0, 10) stays the same date.
function localIso(date, time) {
  return new Date(`${date}T${time}`).toISOString()
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function wrapText(text, maxChars) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

export function placeholderSvg(description) {
  const lines = wrapText(description, 42)
    .map((l, i) => `<text x="40" y="${150 + i * 34}" font-size="24" fill="#444">${escapeXml(l)}</text>`)
    .join('')
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" font-family="sans-serif">' +
    '<rect x="0" y="0" width="640" height="420" rx="24" fill="#e5e5e5"/>' +
    '<text x="40" y="90" font-size="32" font-weight="bold" fill="#333">Sample placeholder</text>' +
    lines +
    '</svg>'
  )
}

// 1 second of silence: 8 kHz, mono, 8-bit PCM (silence is the value 128).
export function silentWav() {
  const dataSize = 8000
  const bytes = new Uint8Array(44 + dataSize)
  const view = new DataView(bytes.buffer)
  const writeAscii = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  writeAscii(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(8, 'WAVE')
  writeAscii(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, 8000, true) // sample rate
  view.setUint32(28, 8000, true) // byte rate
  view.setUint16(32, 1, true) // block align
  view.setUint16(34, 8, true) // bits per sample
  writeAscii(36, 'data')
  view.setUint32(40, dataSize, true)
  bytes.fill(128, 44)
  return bytes
}

function mediaItem(m) {
  const blob =
    m.kind === 'audio'
      ? new Blob([silentWav()], { type: 'audio/wav' })
      : new Blob([placeholderSvg(m.notes)], { type: 'image/svg+xml' })
  return newItem({
    kind: m.kind,
    title: m.title,
    capturedAt: localIso(m.date, '12:30:00'),
    mime: blob.type,
    size: blob.size,
    blob,
    text: m.text || null,
    notes: m.notes,
    tags: ['sample'],
    source: 'sample',
    durationSec: m.kind === 'audio' ? 1 : null,
  })
}

export function buildSampleItems() {
  const notes = sampleEntries.map((e) =>
    newItem({
      kind: 'note',
      title: `Sample: Note ${e.n}`,
      capturedAt: localIso(e.date, '12:00:00'),
      text: e.text,
      tags: ['sample'],
      source: 'sample',
    }),
  )
  return [...notes, ...SAMPLE_MEDIA.map(mediaItem)]
}

// Adds the sample items unless they are already there. Returns how many were added.
export async function loadSampleEvidence() {
  const existing = await db.all()
  if (existing.some(isSampleItem)) return 0
  const items = buildSampleItems()
  for (const item of items) await db.put(item)
  return items.length
}

// Deletes only the sample items. Returns how many were removed.
export async function removeSampleEvidence() {
  const samples = (await db.all()).filter(isSampleItem)
  for (const item of samples) await db.delete(item.id)
  return samples.length
}

// If no names are saved yet, fills in the sample names. Never overwrites a value.
export function withSampleProfile(profile) {
  if (profile.name || profile.respondent) return profile
  const next = { ...profile }
  for (const [key, value] of Object.entries(SAMPLE_PROFILE)) {
    if (!next[key]) next[key] = value
  }
  return next
}
