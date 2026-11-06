// Runs /api/analyze on synthetic entries and prints what came back.
// Serena and Marcus are made-up people; nothing here is real.
//
// Preview deploys sit behind a Vercel login, so this calls the handler directly.
// Run from the repo root (the key is read from .env.local and never printed):
//   node --env-file=.env.local scripts/testAnalyze.js

import handler from '../api/analyze.js'
import { findDangerSigns } from '../data/dangerSigns.js'
import { sampleEntries } from '../src/data/sampleEntries.js'

const extraEntries = [
  { n: 13, date: '2026-11-02', text: "Marcus and I argued about whose turn it was to do the dishes. We were both a bit annoyed, then we split them and watched TV." },
  { n: 14, date: '2026-11-03', text: "Marcus got mad that I was on the phone with my sister and he squeezed my throat until I pulled away." },
  { n: 15, date: '2026-11-04', text: "Marcus showed me the gun he keeps in the nightstand and said if I ever leave, I won't get far." },
  { n: 16, date: '2026-11-05', text: "Marcus took my debit card. He says I get $40 a week for gas and groceries and I have to give him every receipt." },
  { n: 17, date: '2026-11-06', text: "Marcus me dijo que si lo dejo, me mata. Lo dijo muy tranquilo." },
  { n: 18, date: '2026-10-29', kind: 'photo', text: 'Placeholder photo (sample): bruises on my arm where Marcus grabbed it.' },
]
const entries = [...sampleEntries, ...extraEntries]

// labels: categories that must be present ([] means "no labels at all").
// flag: whether the entry must be flagged. Entries not listed are just shown.
const expected = {
  9: { labels: ['Physical harm'], flag: true },
  13: { labels: [], flag: false },
  14: { labels: ['Physical harm'], flag: true },
  15: { labels: ['Threats & intimidation'], flag: true },
  16: { labels: ['Financial control'], flag: false },
  17: { labels: ['Threats & intimidation'], flag: true },
}

// Keyword traps, checked without calling Claude.
const keywordChecks = [
  ['He said he would kill me', 'threats-to-kill', true],
  ['I felt like I could kill myself for forgetting', 'threats-to-kill', false],
  ['He said he will kill himself if I leave', 'suicide-threat', true],
  ['He said he will kill himself if I leave', 'threats-to-kill', false],
  ['He Choked me', 'strangulation', true],
  ['He shot me a look', 'weapon', false],
  ['I couldn’t breathe', 'strangulation', true],
]
const keywordFails = keywordChecks.filter(
  ([text, id, shouldMatch]) => findDangerSigns(text).some((sign) => sign.id === id) !== shouldMatch,
)
console.log(`Keyword checks: ${keywordChecks.length - keywordFails.length}/${keywordChecks.length} passed`)
for (const [text, id] of keywordFails) console.log(`  ✗ "${text}" → ${id}`)

const result = await callHandler({ method: 'POST', body: { entries } })
if (result.status !== 200) {
  console.log(`Request failed (${result.status}):`, result.body)
  process.exit(1)
}
const { categories, safetyFlags, summary, patterns, legalLinks } = result.body

console.log(`\n #  | ${'expected'.padEnd(36)} | ${'got'.padEnd(72)} | ok | keyword match`)
console.log(`----|-${'-'.repeat(36)}-|-${'-'.repeat(72)}-|----|--------------`)
for (const entry of entries) {
  const labels = categories.find((item) => item.entry === entry.n)?.labels ?? []
  const flagged = safetyFlags.some((flag) => flag.entry === entry.n)
  const want = expected[entry.n]
  const ok = want ? (want.labels.length === 0 ? labels.length === 0 : want.labels.every((l) => labels.includes(l))) && want.flag === flagged : null
  const keywordIds = findDangerSigns(entry.text).map((sign) => sign.id).join(',') || '-'
  console.log(
    `${String(entry.n).padStart(3)} | ${(want ? describe(want.labels, want.flag) : '-').padEnd(36)} | ${describe(labels, flagged).padEnd(72)} | ${ok === null ? '  ' : ok ? '✓ ' : '✗ '} | ${keywordIds}`,
  )
}

console.log('\nlegalLinks:')
for (const link of legalLinks) console.log(`  ${link.text}`)

const realNumbers = new Set(entries.map((entry) => entry.n))
const pointsToRealEntries = (item) => item.entries.length > 0 && item.entries.every((n) => realNumbers.has(n))

console.log('\nSummary:')
for (const line of summary) console.log(`  ${line.text} (entries ${line.entries.join(', ')})`)
console.log('\nPatterns over time:')
for (const p of patterns) console.log(`  ${p.name} [${p.firstDate} → ${p.lastDate}; entries ${p.entries.join(', ')}]\n    ${p.description}`)

console.log(`\n"illegal" anywhere in the response: ${/illegal/i.test(JSON.stringify(result.body)) ? 'YES ✗' : 'no ✓'}`)
console.log(`"draft" field gone: ${'draft' in result.body ? 'NO ✗' : 'yes ✓'}`)
console.log(`Every summary line (${summary.length}) and pattern (${patterns.length}) points to real entries: ${[...summary, ...patterns].every(pointsToRealEntries) ? 'yes ✓' : 'NO ✗'}`)
console.log(`At least 2 patterns found: ${patterns.length >= 2 ? 'yes ✓' : 'NO ✗'}`)

function describe(labels, flagged) {
  return `${labels.length ? labels.join(', ') : 'no labels'}; ${flagged ? 'FLAG' : 'no flag'}`
}

// Calls the Vercel handler with a mock request and response.
async function callHandler(req) {
  const captured = { status: 200, body: null }
  const res = {
    status(code) {
      captured.status = code
      return res
    },
    json(body) {
      captured.body = body
      return res
    },
  }
  await handler(req, res)
  return captured
}
