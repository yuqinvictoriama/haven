// Load or remove made-up sample evidence (Serena and Marcus are not real people).
// The 12 sample entries become notes, plus four media items: two real sample
// images from public/sample (a text thread and a bruise) and two placeholders
// (a photo and a voice memo) that match the entries.
// Titles read like something Serena would write, with "(sample)" at the end.
import { db, newItem } from '../lib/db.js'
import { sampleEntries } from './sampleEntries.js'

// Short titles for the 12 sample notes, by entry number.
const NOTE_TITLES = {
  1: 'Marcus read my texts with my sister',
  2: 'Had to move my direct deposit to his account',
  3: "Missed my sister's birthday dinner",
  4: 'My car keys were in his jacket',
  5: 'Tracking app on my phone',
  6: 'Hole punched in the kitchen wall',
  7: 'Shoved into the door frame',
  8: 'Asked for $20 for groceries',
  9: "Grabbed by the neck, couldn't breathe",
  10: 'Blocked the door and took my phone',
  11: 'Bruises on my arm',
  12: 'Bank password changed',
}

const SAMPLE_MEDIA = [
  {
    kind: 'screenshot',
    file: 'texts.png',
    date: '2026-10-26',
    time: '11:47:00',
    title: 'Texts from Marcus threatening to break my door (sample)',
    text: [
      "Marcus (11:46 AM): if you dont talk to me rn, i'm going to break ur door",
      "Marcus (11:46 AM): i'm telling u",
      'Marcus (11:47 AM): i will do it',
      "Marcus (11:47 AM): don't tempt me",
      "Me (11:47 AM): wait i'm sorry",
      'Me (11:47 AM): can we talk tomorrow',
      "Marcus (11:47 AM): serena don't play with me",
      "Marcus (11:47 AM): i don't want to talk to u",
      "Me (11:47 AM): i'm calling the police",
      'Marcus (11:47 AM): its not or never',
      "Marcus (11:47 AM): don't threaten me",
    ].join('\n'),
    notes: 'Screenshot of texts from Marcus the morning after I stayed at my sister\'s. He said he would break my door if I did not talk to him.',
  },
  {
    kind: 'photo',
    file: 'bruise-on-arm.png',
    date: '2026-10-29',
    time: '15:10:00',
    title: 'Photo of the bruise on my arm (sample)',
    notes: 'Photo of my arm the evening Marcus grabbed it because I did not answer his text fast enough at work.',
  },
  {
    kind: 'photo',
    date: '2026-10-09',
    title: 'Photo of the hole in the kitchen wall (sample)',
    notes: 'Placeholder photo (sample): the hole Marcus punched in the kitchen wall.',
  },
  {
    kind: 'audio',
    date: '2026-10-17',
    title: 'Voice memo of the argument about grocery money (sample)',
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

// Real sample images live in public/sample; the other items get a placeholder.
async function mediaBlob(m) {
  if (m.file) {
    const res = await fetch(`/sample/${m.file}`)
    if (!res.ok) throw new Error(`Could not load sample image ${m.file} (${res.status})`)
    return res.blob()
  }
  if (m.kind === 'audio') return new Blob([silentWav()], { type: 'audio/wav' })
  return new Blob([placeholderSvg(m.notes)], { type: 'image/svg+xml' })
}

async function mediaItem(m) {
  const blob = await mediaBlob(m)
  return newItem({
    kind: m.kind,
    title: m.title,
    capturedAt: localIso(m.date, m.time || '12:30:00'),
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

export async function buildSampleItems() {
  const notes = sampleEntries.map((e) =>
    newItem({
      kind: 'note',
      title: `${NOTE_TITLES[e.n] || `Note ${e.n}`} (sample)`,
      capturedAt: localIso(e.date, '12:00:00'),
      text: e.text,
      tags: ['sample'],
      source: 'sample',
    }),
  )
  const media = await Promise.all(SAMPLE_MEDIA.map(mediaItem))
  return [...notes, ...media]
}

// Adds the sample items unless they are already there. Returns how many were added.
export async function loadSampleEvidence() {
  const existing = await db.all()
  if (existing.some(isSampleItem)) return 0
  const items = await buildSampleItems()
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
