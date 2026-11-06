// POST /api/analyze — sends the entries to Claude and returns the analysis.
//
// Request:  { entries: [{ n: 1, date: "2026-09-21", text: "..." }, ...] }
// Response: { categories:  [{ entry: 1, labels: ["Isolation & control"] }, ...],
//             safetyFlags: [{ entry: 9, reason: "..." }, ...],
//             draft:       ["On October 18, 2026, Marcus ... [Entry 9]", ...] }
// Error:    { error: "friendly message" }   (details go to the server log only)
//
// The API key (ANTHROPIC_API_KEY) is read here on the server and never sent to the browser.

import Anthropic from '@anthropic-ai/sdk'
import { CATEGORIES, SYSTEM_PROMPT, buildUserMessage } from '../prompts/analyze.js'

const MAX_ENTRIES = 100
const FRIENDLY_ERROR = "Sorry, we couldn't look over your entries right now. Please try again in a moment."

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
          labels: { type: 'array', items: { type: 'string', enum: CATEGORIES } },
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
    draft: { type: 'array', items: { type: 'string' } },
  },
  required: ['categories', 'safetyFlags', 'draft'],
  additionalProperties: false,
}

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

  return keepOnlyRealEntries(JSON.parse(text), entries)
}

// Never invent facts: drop anything that doesn't point to a real entry,
// including any draft sentence that doesn't end in [Entry N].
function keepOnlyRealEntries(result, entries) {
  const realNumbers = new Set(entries.map((entry) => entry.n))
  const draft = result.draft.filter((sentence) => endsWithRealEntry(sentence, realNumbers))
  if (draft.length < result.draft.length) {
    console.warn(`Dropped ${result.draft.length - draft.length} draft sentence(s) without a real [Entry N].`)
  }
  return {
    categories: result.categories.filter((item) => realNumbers.has(item.entry)),
    safetyFlags: result.safetyFlags.filter((flag) => realNumbers.has(flag.entry)),
    draft,
  }
}

function endsWithRealEntry(sentence, realNumbers) {
  const match = sentence.trim().match(/\[Entry (\d+)\]$/)
  return match !== null && realNumbers.has(Number(match[1]))
}
