// POST /api/analyze — sends the entries to Claude and returns the analysis.
//
// Request:  { entries: [{ n: 1, date: "2026-09-21", kind: "note", text: "..." }, ...] }
//           kind is optional: note, text, log, screenshot, photo, audio, video, file.
//           For photos, recordings and screenshots, text is the saved description or what was read from it.
// Response: { categories:  [{ entry: 1, labels: ["Isolation & control"] }, ...],
//             safetyFlags: [{ entry: 9, reason: "..." }, ...],
//             summary:     [{ text: "Your notes describe ...", entries: [1, 5, 10] }, ...],
//             patterns:    [{ name: "Watching your phone", description: "...", entries: [1, 5, 10],
//                             firstDate: "2026-09-21", lastDate: "2026-10-25" }, ...],
//             legalLinks:  [{ category: "Financial control", subsections: ["6320(c)(2)", "6320(c)(3)"],
//                             text: "Financial control may be relevant to ..." }, ...] }
// Error:    { error: "friendly message" }   (details go to the server log only)
//
// The API key (ANTHROPIC_API_KEY) is read here on the server and never sent to the browser.

import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserMessage } from '../prompts/analyze.js'
import { CATEGORIES, CATEGORY_NAMES } from '../data/categories.js'
import { findDangerSigns } from '../data/dangerSigns.js'

const MAX_ENTRIES = 100
const FRIENDLY_ERROR = "Sorry, we couldn't look over your entries right now. Please try again in a moment."
const CALM_FLAG_REASON = 'You wrote about something that advocates treat as a serious danger sign.'

// The exact JSON shape Claude must return (structured outputs).
const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entry: { type: 'integer' },
          labels: { type: 'array', items: { type: 'string', enum: CATEGORY_NAMES } },
        },
        required: ['entry', 'labels'],
        additionalProperties: false,
      },
    },
    safetyFlags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entry: { type: 'integer' },
          reason: { type: 'string' },
        },
        required: ['entry', 'reason'],
        additionalProperties: false,
      },
    },
    summary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          entries: { type: 'array', items: { type: 'integer' } },
        },
        required: ['text', 'entries'],
        additionalProperties: false,
      },
    },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          entries: { type: 'array', items: { type: 'integer' } },
        },
        required: ['name', 'description', 'entries'],
        additionalProperties: false,
      },
    },
  },
  required: ['categories', 'safetyFlags', 'summary', 'patterns'],
  additionalProperties: false,
}

const KINDS = ['note', 'text', 'log', 'screenshot', 'photo', 'audio', 'video', 'file']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Please send your entries with a POST request.' })
  }

  const entries = readEntries(req)
  if (!entries) {
    return res.status(400).json({ error: 'Please add at least one entry before analyzing.' })
  }

  try {
    const result = await analyzeEntries(entries)
    return res.status(200).json(result)
  } catch (error) {
    console.error('Analyze failed:', error)
    return res.status(500).json({ error: FRIENDLY_ERROR })
  }
}

// Returns a clean list of entries, or null if the request has none we can use.
function readEntries(req) {
  let raw
  try {
    raw = req.body?.entries // Vercel throws here if the body isn't valid JSON
  } catch {
    return null
  }
  if (!Array.isArray(raw) || raw.length > MAX_ENTRIES) return null

  const entries = raw
    .filter((entry) => Number.isInteger(entry?.n) && typeof entry.text === 'string' && entry.text.trim())
    .map((entry) => ({
      n: entry.n,
      date: typeof entry.date === 'string' ? entry.date : '',
      kind: KINDS.includes(entry.kind) ? entry.kind : 'note',
      text: entry.text.trim(),
    }))
  return entries.length > 0 ? entries : null
}

async function analyzeEntries(entries) {
  const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    // If Claude declines, Anthropic retries on its recommended backup model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RESULT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(entries) }],
  })

  if (response.stop_reason !== 'end_turn') {
    throw new Error(`Claude stopped early: ${response.stop_reason} ${JSON.stringify(response.stop_details ?? null)}`)
  }
  const text = response.content.find((block) => block.type === 'text')?.text
  if (!text) throw new Error('Claude returned no text')

  const checked = removeIllegalWording(keepOnlyRealEntries(JSON.parse(text), entries))
  const safetyFlags = addKeywordFlags(checked.safetyFlags, entries)
  return {
    ...checked,
    safetyFlags,
    patterns: addDateRanges(checked.patterns, entries),
    legalLinks: buildLegalLinks(checked.categories),
  }
}

// Never invent facts: drop anything that doesn't point to a real entry.
// Summary lines and patterns keep only real entry numbers, and are dropped if none are left.
function keepOnlyRealEntries(result, entries) {
  const realNumbers = new Set(entries.map((entry) => entry.n))
  const withRealEntries = (items, label) => {
    const kept = items
      .map((item) => ({ ...item, entries: [...new Set(item.entries.filter((n) => realNumbers.has(n)))].sort((a, b) => a - b) }))
      .filter((item) => item.entries.length > 0)
    if (kept.length < items.length) console.warn(`Dropped ${items.length - kept.length} ${label} without a real entry.`)
    return kept
  }
  return {
    categories: result.categories.filter((item) => realNumbers.has(item.entry)),
    safetyFlags: result.safetyFlags.filter((flag) => realNumbers.has(flag.entry)),
    summary: withRealEntries(result.summary, 'summary line(s)'),
    patterns: withRealEntries(result.patterns, 'pattern(s)'),
  }
}

// Built in code, not by Claude: the first and latest date among a pattern's entries.
function addDateRanges(patterns, entries) {
  const dateOf = new Map(entries.map((entry) => [entry.n, entry.date]))
  return patterns.map((pattern) => {
    const dates = pattern.entries.map((n) => dateOf.get(n)).filter(Boolean).sort()
    return { ...pattern, firstDate: dates[0] || '', lastDate: dates[dates.length - 1] || '' }
  })
}

// Never say something "is illegal". Drop summary lines and patterns that use the word
// (or "illegally"). Keep every safety flag, but give it a calm generic reason.
function removeIllegalWording(result) {
  const saysIllegal = (value) => /illegal/i.test(value)
  const summary = result.summary.filter((line) => !saysIllegal(line.text))
  const patterns = result.patterns.filter((pattern) => !saysIllegal(pattern.name + ' ' + pattern.description))
  const dropped = result.summary.length - summary.length + result.patterns.length - patterns.length
  if (dropped > 0) console.warn(`Dropped ${dropped} summary line(s) or pattern(s) that said "illegal".`)
  let replaced = 0
  const safetyFlags = result.safetyFlags.map((flag) => {
    if (!/illegal/i.test(flag.reason)) return flag
    replaced++
    return { ...flag, reason: CALM_FLAG_REASON }
  })
  if (replaced > 0) console.warn(`Replaced ${replaced} safety flag reason(s) that said "illegal".`)
  return { ...result, summary, patterns, safetyFlags }
}

// Err toward safety: also flag any entry whose words match a danger sign in
// data/dangerSigns.js. This only adds flags; it never removes Claude's.
function addKeywordFlags(safetyFlags, entries) {
  const flagged = new Set(safetyFlags.map((flag) => flag.entry))
  const added = entries
    .filter((entry) => !flagged.has(entry.n))
    .map((entry) => ({ entry: entry.n, signs: findDangerSigns(entry.text) }))
    .filter((match) => match.signs.length > 0)
    .map((match) => ({ entry: match.entry, reason: match.signs.map((sign) => sign.reason).join(' ') }))
  if (added.length > 0) console.warn(`Added ${added.length} safety flag(s) from danger-sign keywords.`)
  return [...safetyFlags, ...added]
}

// Built in code, not by Claude: one line per category found, in category order.
function buildLegalLinks(categories) {
  const found = new Set(categories.flatMap((item) => item.labels))
  return CATEGORIES.filter((category) => found.has(category.name)).map((category) => ({
    category: category.name,
    subsections: category.subsections,
    text: `${category.name} may be relevant to California Family Code section ${category.subsections.join(' and ')}.`,
  }))
}
