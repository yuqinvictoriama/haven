// POST /api/parse
// Request:  { text, source, context, images: [{ media_type, data }] }
// Response: { summary, parties, incidents, patterns, risk_flags, suggested_exhibits, model, usage }
// Parses pasted messages, logs, or screenshots of messages into structured
// evidence (incidents, patterns, lethality flags) using Claude structured outputs.
import {
  MODEL, BETAS, resolveKey, makeClient, json, noKey, methodNotAllowed, readJson, mapError, usageOf, textOf,
} from './_claude.js'

const SOURCES = new Set(['sms', 'imessage', 'whatsapp', 'email', 'social', 'log', 'other'])
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_TEXT = 60_000
const MAX_IMAGES = 6

const INCIDENT_TYPES = [
  'threat', 'intimidation', 'harassment', 'physical', 'sexual', 'stalking', 'coercive_control',
  'financial', 'isolation', 'property', 'child_related', 'other',
]

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'parties', 'incidents', 'patterns', 'risk_flags', 'suggested_exhibits'],
  properties: {
    summary: { type: 'string', description: '2-4 sentences in plain, neutral language.' },
    parties: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'role'],
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['survivor', 'respondent', 'witness', 'other'] },
        },
      },
    },
    incidents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'date', 'time', 'date_text', 'type', 'severity', 'quote', 'speaker', 'explanation'],
        properties: {
          id: { type: 'string', description: 'i1, i2, ... in document order' },
          date: { type: ['string', 'null'], description: 'YYYY-MM-DD only if stated or safely inferable, else null' },
          time: { type: ['string', 'null'], description: 'HH:MM 24h if stated, else null' },
          date_text: { type: ['string', 'null'], description: 'The date/time as written in the source, or null' },
          type: { type: 'string', enum: INCIDENT_TYPES },
          severity: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          quote: { type: 'string', description: 'Verbatim excerpt from the source' },
          speaker: { type: 'string', description: 'Who wrote/said it, as labeled in the source' },
          explanation: { type: 'string', description: 'What this shows and why it matters for a DVRO' },
        },
      },
    },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'incident_ids'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          incident_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    risk_flags: {
      type: 'array',
      items: { type: 'string' },
      description: "Short phrases, e.g. 'threat to kill', 'access to firearm', 'strangulation', 'escalation over time'",
    },
    suggested_exhibits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'incident_ids'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          incident_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const SYSTEM = `You are Haven's evidence analyst. Haven helps survivors of domestic violence document abuse and prepare materials for advocates, courts (e.g. a Domestic Violence Restraining Order), and police.

You will receive pasted messages, call/text logs, emails, or screenshots of conversations. Extract structured evidence.

Principles:
- Trauma-informed and neutral. Never blame, doubt, or lecture the survivor. Describe behavior, not character.
- Quote verbatim. Every incident's "quote" must be copied exactly from the source (trim surrounding text, keep spelling and emoji). Never paraphrase inside quotes.
- Do not invent facts. If a date or time is not stated or safely inferable (e.g. a relative "yesterday" with no anchor), set date/time to null and put whatever the source shows in date_text. Do not guess names; use labels as they appear ("Me", "+1 555...", "J").
- Severity 1-5: 1 = unpleasant/controlling tone, 2 = harassment or pressure, 3 = intimidation, explicit control, threats to property/finances/custody, 4 = threats of harm, stalking, admitted or described physical violence, 5 = threats to kill, strangulation, weapons, sexual violence, threats to children.
- Lethality indicators (Danger Assessment style) go in risk_flags using short phrases: threats to kill, access to or threats with a firearm/weapon, strangulation/choking, stalking or monitoring, extreme jealousy or control, threats around separation, threats involving children or pets, escalation in frequency or severity, suicide threats by the abuser, substance abuse, prior violence. Only list what the material supports.
- Patterns: name recurring dynamics (e.g. "Escalates when she does not reply", "Threatens custody to force contact", "Monitoring her location") and reference the incident ids that show them.
- Suggested exhibits: how an advocate would package this material (e.g. "Exhibit: Threats on 2026-03-02", "Exhibit: Pattern of 40+ unanswered calls").
- One incident per distinct threatening/abusive statement or event. Benign messages are not incidents.
- parties: list the people who appear, with the survivor as "survivor" and the person engaging in abusive behavior as "respondent" when that is clear from context; otherwise "other".
- The summary is 2-4 plain sentences an advocate can read in 10 seconds. This output supports, and does not replace, legal advice.`

function validate(body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const images = Array.isArray(body?.images) ? body.images : []
  if (!text && images.length === 0) return { error: 'Provide text or at least one image.' }
  if (text.length > MAX_TEXT) return { error: `Text is too long (${text.length} chars, max ${MAX_TEXT}). Split it into parts.` }
  if (images.length > MAX_IMAGES) return { error: `Too many images (max ${MAX_IMAGES}).` }
  for (const img of images) {
    if (!img || !IMAGE_TYPES.has(img.media_type) || typeof img.data !== 'string' || !img.data) {
      return { error: 'Each image needs media_type (png/jpeg/webp/gif) and base64 data without a data: prefix.' }
    }
  }
  const source = SOURCES.has(body?.source) ? body.source : 'other'
  const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 4000) : ''
  return { text, images, source, context }
}

function extractJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function normalize(parsed) {
  const arr = (v) => (Array.isArray(v) ? v : [])
  const str = (v) => (typeof v === 'string' ? v : v == null ? null : String(v))
  return {
    summary: str(parsed?.summary) ?? '',
    parties: arr(parsed?.parties).map((p) => ({ name: str(p?.name) ?? '', role: str(p?.role) ?? 'other' })),
    incidents: arr(parsed?.incidents).map((i, idx) => ({
      id: str(i?.id) ?? `i${idx + 1}`,
      date: str(i?.date),
      time: str(i?.time),
      date_text: str(i?.date_text),
      type: INCIDENT_TYPES.includes(i?.type) ? i.type : 'other',
      severity: Math.min(5, Math.max(1, Number(i?.severity) || 1)),
      quote: str(i?.quote) ?? '',
      speaker: str(i?.speaker) ?? '',
      explanation: str(i?.explanation) ?? '',
    })),
    patterns: arr(parsed?.patterns).map((p) => ({
      name: str(p?.name) ?? '',
      description: str(p?.description) ?? '',
      incident_ids: arr(p?.incident_ids).map(String),
    })),
    risk_flags: arr(parsed?.risk_flags).map(String),
    suggested_exhibits: arr(parsed?.suggested_exhibits).map((e) => ({
      title: str(e?.title) ?? '',
      description: str(e?.description) ?? '',
      incident_ids: arr(e?.incident_ids).map(String),
    })),
  }
}

export async function GET() {
  return methodNotAllowed()
}

export async function POST(request) {
  const auth = resolveKey(request)
  if (!auth) return noKey()

  const body = await readJson(request)
  if (!body) return json(400, { error: 'bad_json', message: 'Body must be JSON.' })
  const v = validate(body)
  if (v.error) return json(400, { error: 'bad_request', message: v.error })

  const content = []
  for (const img of v.images) {
    content.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } })
  }
  const parts = [`Source type: ${v.source}.`]
  if (v.context) parts.push(`Context from the survivor: ${v.context}`)
  if (v.images.length) parts.push(`${v.images.length} screenshot(s) attached above. Read every message in them.`)
  if (v.text) parts.push(`Pasted material:\n<material>\n${v.text}\n</material>`)
  parts.push('Extract the structured evidence now.')
  content.push({ type: 'text', text: parts.join('\n\n') })

  const client = makeClient(auth.key)
  try {
    const message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: BETAS,
      fallbacks: 'default',
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content }],
    })

    if (message.stop_reason === 'refusal') {
      return json(503, {
        error: 'refusal',
        message: message.stop_details?.explanation || 'Claude declined to analyze this material.',
      })
    }
    const parsed = extractJson(textOf(message))
    if (!parsed) {
      return json(502, {
        error: 'bad_output',
        message: message.stop_reason === 'max_tokens' ? 'Output was cut off; try a shorter excerpt.' : 'Claude returned unparseable output.',
      })
    }
    return json(200, { ...normalize(parsed), model: message.model ?? MODEL, usage: usageOf(message) })
  } catch (err) {
    return mapError(err)
  }
}
