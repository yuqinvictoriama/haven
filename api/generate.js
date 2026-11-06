// POST /api/generate
// Request:  { kind, jurisdiction, profile, evidence: [...], notes, stream }
// Response: stream=true (default) -> 200 text/markdown streamed as raw text chunks
//           stream=false          -> 200 { markdown, model, usage }
// Drafts legal/advocacy documents (DVRO narrative, DV-101, exhibit list, advocate
// one-pager, criminal case packet, safety plan, timeline, or the whole packet)
// from the survivor's saved evidence.
import {
  MODEL, BETAS, HOTLINE_FOOTER, resolveKey, makeClient, json, noKey, methodNotAllowed, readJson, mapError, usageOf, textOf,
} from './_claude.js'

const MAX_EVIDENCE = 200
const MAX_ITEM_TEXT = 12_000
const MAX_TOTAL_TEXT = 300_000

const DISCLAIMER = '*This is not legal advice. Review with a court self-help center or advocate before filing.*'

// Shared by the DV-100 and DV-101 drafts: answer form questions only from the evidence.
const FORM_ANSWER_RULES = `Form answer rules: answer each checkbox question as "Yes: ...", "No: ...", or "I don't know: ..." using ONLY what the evidence says, with the exhibit citation. If the evidence does not answer a question, write "[not in your evidence — add if you want]" instead of guessing (for example: witnesses, police, injuries, weapons, how it affected you). Every factual answer cites its exhibit, e.g. "(Exhibit 3, note, 2026-10-21)".`

const SPECS = {
  dvro: {
    title: 'DV-100 Request for Domestic Violence Restraining Order — Draft Answers',
    spec: `Draft answers that mirror the official California Judicial Council form DV-100, "Request for Domestic Violence Restraining Order" (Rev. January 1, 2025), so the survivor can copy them onto the form.
Right after the disclaimer line and the title, add this line exactly: "Copy these answers onto form DV-100 (Rev. January 1, 2025): https://courts.ca.gov/documents/dv100.pdf"
Use these exact item numbers and headings, in this order, each as a level-2 heading "## N. Heading":
1. Person Asking for Protection — a. Your full name; b. Your age; c. Address where you can receive court papers; d. Your contact information (optional); e. Your lawyer's information (if you have one). Use the profile; write "[fill in]" for anything missing.
2. Person You Want Protection From — a. Full name; b. Age; c. Date of birth; d. Gender; e. Race. Use the profile; "[fill in]" for anything missing.
3. Your Relationship to the Person in 2 — from the profile only (e.g. dating, married, living together, have a child together); "[fill in]" if missing.
4. Other Restraining Orders and Court Cases — "[fill in]" unless the evidence mentions one.
5. Most Recent Abuse — the most recent incident in the evidence. Answer each sub-item:
   a. Date of abuse
   b. Did anyone else hear or see what happened on this day? (I don't know / No / Yes — names)
   c. Did the person in 2 use or threaten to use a gun or other weapon? (No / Yes — describe)
   d. Did the person in 2 cause you any emotional or physical harm? (No / Yes — describe)
   e. Did the police come? (I don't know / No / Yes)
   f. Give more details about how the person in 2 was abusive on this day (what was said, done, or sent — texts, emails, pictures)
   g. How often has the person in 2 abused you like this? (Just this once / 2–5 times / Weekly / Other) and list the dates from the evidence.
6. Has the person in 2 abused you in a different way from the abuse you described in 5? — pick a different kind of abuse from the evidence and answer the same a–g.
7. Is there other abuse by the person in 2 that you want the judge to know about? — another incident or kind of abuse from the evidence, same a–g. If more incidents remain, say "See DV-101 (item 32)".
8. Other Protected People — children or household members from the profile; "[fill in]" if none listed.
9. Does the person in 2 have firearms (guns), firearm parts, or ammunition? (I don't know / No / Yes — describe) — from the evidence only.
10–31. Orders you can ask for — one short note that the survivor chooses these on the form themselves (Haven does not choose for them), then list the names only, as a plain bulleted list without checkmarks: 10 Order to Not Abuse; 11 No-Contact Order; 12 Stay-Away Order; 13 Order to Move Out; 14 Other Orders; 15 Child Custody and Visitation; 16 Protect Animals; 17 Control of Property; 18 Health Insurance; 19 Record Communications; 20 Property Restraint; 21 Extend Deadline to Give Notice; 22 Pay Debts (Bills) Owed for Property; 23 Pay Expenses Caused by the Abuse; 24 Child Support; 25 Spousal Support; 26 Rights to Mobile Device and Wireless Phone Account; 27 Batterer Intervention Program; 28 Lawyer's Fees and Costs; 29 No Firearms (Guns), Firearm Parts, or Ammunition; 30 No Body Armor; 31 Cannot Look for Protected People. Use the heading "## 10–31. Orders You Can Ask For".
32. Additional Pages — if more space is needed for 5–7, use form DV-101 (Description of Abuse).
33. Your Signature — "You sign the form yourself."
Write answers in first person as the person asking for protection. Quote messages verbatim. Keep each answer short and factual.
${FORM_ANSWER_RULES}`,
  },
  dv101: {
    title: 'DV-101 Description of Abuse — Draft Answers',
    spec: `Draft answers that mirror the official California Judicial Council form DV-101, "Description of Abuse" (Rev. January 1, 2017), in first person, so the survivor can copy them onto the form.
Right after the disclaimer line and the title, add this line exactly: "Copy these answers onto form DV-101 (Rev. January 1, 2017): https://courts.ca.gov/sites/default/files/courts/default/2024-11/dv101.pdf"
Use these exact item numbers and headings, each as a level-2 heading "## N. Heading":
1. Name of person asking for protection — from the profile; "[fill in]" if missing.
2. Name of person you want protection from — from the profile; "[fill in]" if missing.
3. Describe abuse to you or your children — the most recent incident in the evidence. Sub-items:
   a. Date of abuse
   b. Who was there?
   c. Describe how the person in 2 abused you or your children (plain, specific; quote messages verbatim)
   d. Describe any use or threatened use of guns or other weapons
   e. Describe any injuries
   f. Did the police or other law enforcement come? (Yes / No / I don't know) If yes: did they give you or the person in 2 an Emergency Protective Order? (Yes / No / I don't know)
4. Has the person in 2 abused you (or your children) other times? — Yes, then each earlier incident from the evidence, newest first, as "### Incident: [date]" with the same a–f. Do not merge incidents.
5. More space — "If you need more space, attach a sheet of paper and write 'DV-101—Description of Abuse' at the top."
Do not add any section about feelings, fear, or why the survivor is afraid. At most, end with one line: "[In your own words, if you want: anything else you want the judge to know]".
${FORM_ANSWER_RULES}`,
  },
  exhibit_list: {
    title: 'Exhibit List',
    spec: `Produce:
1. A numbered exhibit list as a Markdown table with columns: Ex. # | Date | Type | Description | What it proves | Source / file. Number in chronological order (oldest first). Each saved evidence item is one exhibit; split an item into lettered sub-exhibits (3a, 3b) only when it contains clearly separate incidents.
2. "Patterns over time": escalation over time, frequency by month (a small table: Month | Incidents | Types seen), types of abuse seen, and timing patterns (e.g. after separation, late night, when contact is refused).
3. "Gaps / what to still collect": concrete items (e.g. "police report #", "photos of damage dated", "witness statement from ...", "phone carrier call log for March").`,
  },
  advocate_summary: {
    title: 'One-Page Summary for an Advocate',
    spec: `Write a ONE-PAGE summary (target 350-450 words) an advocate can read in two minutes. Sections, each short:
- Situation (3-4 sentences: who, relationship, current living situation, children)
- Immediate safety concerns and lethality flags (bullets; say which are evidenced)
- Timeline highlights (5-8 dated bullets, newest last, with exhibit references)
- Evidence inventory (one line per type: e.g. "4 screenshots, 2 audio recordings, 1 photo")
- What the survivor is asking for
- Suggested next steps (3-5 bullets: e.g. DVRO filing, police report, safety plan, shelter/legal aid referral)
End with the hotline footer line.`,
  },
  criminal_case: {
    title: 'Criminal Case Packet (for police / District Attorney)',
    spec: `Prepare a packet to hand to police or a District Attorney's office. Sections:
1. "Summary for the reporting officer" (one paragraph).
2. "Possible offenses and elements" — for each California offense that police or a prosecutor may consider based on the evidence (consider PC 273.5 corporal injury to an intimate partner, PC 243(e)(1) domestic battery, PC 422 criminal threats, PC 646.9 stalking, PC 653m harassing calls/electronic communications, PC 591/594 property damage, PC 236 false imprisonment, PC 166/273.6 violation of a protective order if any, PC 653.2 electronic harassment), list the elements as a checklist and mark each element "Evidence that may be relevant: Exhibit N" or "No evidence yet — would need: ...". Do not overstate; be explicit about gaps. Never state that anything is illegal or that a crime was committed; Haven does not draw legal conclusions, it only shows which elements the evidence may be relevant to.
3. "Incident-by-incident statement" in first person, chronological, with quotes verbatim and exhibit citations.
4. "Evidence index" (table: Exhibit | Date | Type | Description | Where stored).
5. "Witnesses" (name/role/what they know, or "[none identified]").
6. "Requested actions" (e.g. report number, Emergency Protective Order, firearm relinquishment, charging referral, victim advocate contact, Marsy's Law rights notice).
Keep the whole packet under about 1,600 words so it generates in time: one short line per element, and a brief incident statement that points to exhibits instead of repeating every detail.`,
  },
  safety_plan: {
    title: 'Personalized Safety Plan',
    spec: `Write a personalized safety plan grounded in the specific risks in the evidence. Sections: Right now (immediate steps tied to the specific risk flags); At home; Leaving / if I have to leave quickly (go-bag checklist, documents, where to go, who to call); Phone and digital safety (location sharing, shared accounts, passwords, this app, screenshots backups); Work / school; Children (if any); Legal (DVRO, police report, what to bring); Support people and contacts (fill-in table). Keep it practical, short bullets, second person ("you"). End with the hotline footer line.`,
  },
  timeline: {
    title: 'Incident Timeline',
    spec: `Produce a chronological Markdown table of every incident found in the evidence (oldest first): Date | Time | What happened (short, verbatim quote where available) | Type | Exhibit. Use "[DATE UNKNOWN]" and sort undated items at the end under their best-known period. After the table, add "Escalation summary" (3-5 bullets on how frequency and seriousness changed over time, without numeric scores).`,
  },
}

const EVERYTHING_ORDER = ['advocate_summary', 'timeline', 'exhibit_list', 'dvro', 'dv101', 'criminal_case', 'safety_plan']

const KINDS = new Set([...Object.keys(SPECS), 'everything'])
const EVIDENCE_KINDS = new Set(['text', 'log', 'photo', 'recording', 'audio', 'screenshot', 'video', 'file', 'note'])
const MEDIA_KINDS = new Set(['photo', 'recording', 'audio', 'screenshot', 'video', 'file'])

function systemPrompt(kind, jurisdiction) {
  const rules = `You are Haven's document drafter. Haven helps survivors of domestic violence turn their saved evidence into documents for advocates, courts, and police. Jurisdiction: ${jurisdiction}. Adapt form names and statutes to that jurisdiction when it is not California, and say so in one line.

Rules for every document:
- Output Markdown only. Begin with exactly this line, then a blank line: ${DISCLAIMER}
- Then a level-1 heading with the document title and the date "[DATE]" placeholder for signing.
- Use the evidence as citations in parentheses, e.g. "(Exhibit 3, screenshot, 2026-03-02)". Exhibit numbers come from the evidence list you are given; do not renumber.
- Never invent facts, dates, names, injuries, or events. Where a needed fact is missing, write a bracketed placeholder such as [NAME], [DATE], [ADDRESS], [POLICE REPORT #] and keep going.
- Never add feelings, fears, injuries, motives, or details that the evidence does not contain. Do not write how the survivor felt, what they feared, or why something happened unless the evidence says it in their words. If a section asks for something the evidence does not contain (for example, why the survivor is afraid), leave a placeholder for their own words, such as "[In your own words: ...]".
- Media items (photo, audio, video, screenshot, file) without a transcript are known only by the survivor's description; refer to them as "described as ..." and never describe what they show beyond that description.
- Quote threatening or abusive messages verbatim, in quotation marks, exactly as written.
- Trauma-informed, neutral, specific. Describe behavior, not character. Never blame the survivor.
- No legal conclusions: never say that anything "is illegal" or that a crime was committed; at most say the facts "may be relevant to" a statute (for California, Family Code section 6320). No numeric risk scores, ratings, or predictions. Calm, plain, supportive tone.
- Prefer short paragraphs, headings, bullets, and tables. Plain language. No preamble or closing commentary outside the document.
- Hotline footer line, where a spec asks for it: ${HOTLINE_FOOTER}`
  if (kind === 'everything') {
    const sections = EVERYTHING_ORDER.map((k, i) => `${i + 1}. ${SPECS[k].title}\n${SPECS[k].spec}`).join('\n\n')
    return `${rules}

Produce ONE packet containing all of the following documents, in this order, each starting with a level-1 heading, preceded by a "Contents" list at the top. Be complete but economical: this packet must stay under roughly 5,000 words, so keep each document tight and avoid repeating the same incident narrative verbatim across sections (reference the timeline instead).

${sections}`
  }
  return `${rules}

Document to produce: ${SPECS[kind].title}
${SPECS[kind].spec}`
}

function fmtDate(iso) {
  if (!iso) return '[date unknown]'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? String(iso) : d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

function formatEvidence(evidence) {
  const sorted = [...evidence].sort((a, b) => {
    const ta = Date.parse(a.capturedAt ?? '') || Infinity
    const tb = Date.parse(b.capturedAt ?? '') || Infinity
    return ta - tb
  })
  let budget = MAX_TOTAL_TEXT
  const blocks = sorted.map((e, i) => {
    const n = i + 1
    const kind = EVIDENCE_KINDS.has(e.kind) ? e.kind : 'other'
    const lines = [`### Exhibit ${n} — ${kind} — "${e.title || 'Untitled'}" — captured ${fmtDate(e.capturedAt)}`]
    if (e.id) lines.push(`File/id: ${e.id}`)
    if (e.notes) lines.push(`Survivor's notes: ${String(e.notes).slice(0, 4000)}`)
    if (typeof e.text === 'string' && e.text.trim()) {
      let t = e.text.trim()
      if (t.length > MAX_ITEM_TEXT) t = t.slice(0, MAX_ITEM_TEXT) + '\n[... truncated ...]'
      if (t.length > budget) t = t.slice(0, Math.max(0, budget)) + '\n[... truncated ...]'
      budget -= t.length
      lines.push(`Content:\n<content>\n${t}\n</content>`)
    } else if (MEDIA_KINDS.has(kind)) {
      // No transcript: give the model the survivor's own description, clearly marked as not a transcript.
      const desc = e.notes ? String(e.notes).slice(0, 1000) : 'none given'
      lines.push(`Content: (${kind} — description: ${desc}; not transcribed — cite it by exhibit number and this description only)`)
    }
    const a = e.analysis
    if (a && typeof a === 'object') {
      lines.push('Prior Claude analysis of this exhibit:')
      if (a.summary) lines.push(`- Summary: ${a.summary}`)
      for (const inc of Array.isArray(a.incidents) ? a.incidents : []) {
        lines.push(
          `- Incident ${inc.id ?? ''}: ${inc.date ?? inc.date_text ?? '[date unknown]'}${inc.time ? ' ' + inc.time : ''} | ${inc.type ?? 'other'} | severity ${inc.severity ?? '?'} | "${inc.quote ?? ''}" (${inc.speaker ?? 'unknown'}) — ${inc.explanation ?? ''}`,
        )
      }
      for (const p of Array.isArray(a.patterns) ? a.patterns : []) lines.push(`- Pattern: ${p.name}: ${p.description}`)
      if (Array.isArray(a.risk_flags) && a.risk_flags.length) lines.push(`- Risk flags: ${a.risk_flags.join('; ')}`)
    }
    return lines.join('\n')
  })
  return blocks.join('\n\n')
}

function userPrompt({ kind, jurisdiction, profile, evidence, notes }) {
  const parts = []
  parts.push(`Jurisdiction: ${jurisdiction}`)
  parts.push(`Survivor profile (may be incomplete; use placeholders for anything missing):\n${JSON.stringify(profile, null, 2)}`)
  parts.push(
    evidence.length
      ? `Saved evidence (${evidence.length} item(s), already numbered as exhibits — cite these numbers):\n\n${formatEvidence(evidence)}`
      : 'Saved evidence: none yet. Draft the document structure with placeholders and clear instructions for what to fill in.',
  )
  if (notes) parts.push(`Additional instructions from the survivor:\n${notes}`)
  parts.push(`Draft the "${kind === 'everything' ? 'complete packet' : SPECS[kind].title}" now.`)
  return parts.join('\n\n')
}

function parseBody(body) {
  const kind = KINDS.has(body?.kind) ? body.kind : null
  if (!kind) return { error: `kind must be one of: ${[...KINDS].join(', ')}` }
  const jurisdiction = typeof body.jurisdiction === 'string' && body.jurisdiction.trim() ? body.jurisdiction.trim().slice(0, 80) : 'California'
  const profile = body.profile && typeof body.profile === 'object' && !Array.isArray(body.profile) ? body.profile : {}
  const evidence = (Array.isArray(body.evidence) ? body.evidence : [])
    .filter((e) => e && typeof e === 'object')
    .slice(0, MAX_EVIDENCE)
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 8000) : ''
  const stream = body.stream !== false
  return { kind, jurisdiction, profile, evidence, notes, stream }
}

export async function GET() {
  return methodNotAllowed()
}

export async function POST(request) {
  const auth = resolveKey(request)
  if (!auth) return noKey()
  const body = await readJson(request)
  if (!body) return json(400, { error: 'bad_json', message: 'Body must be JSON.' })
  const p = parseBody(body)
  if (p.error) return json(400, { error: 'bad_request', message: p.error })

  const client = makeClient(auth.key)
  const params = {
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    system: systemPrompt(p.kind, p.jurisdiction),
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: userPrompt(p) }],
  }

  if (!p.stream) {
    try {
      const message = await client.beta.messages.create(params)
      if (message.stop_reason === 'refusal') {
        return json(503, { error: 'refusal', message: message.stop_details?.explanation || 'Claude declined to draft this document.' })
      }
      return json(200, { markdown: textOf(message), model: message.model ?? MODEL, usage: usageOf(message), stop_reason: message.stop_reason })
    } catch (err) {
      return mapError(err)
    }
  }

  // Streaming: `create({stream:true})` resolves once the HTTP response starts, so
  // auth/validation errors are thrown here and returned as proper JSON statuses.
  let apiStream
  try {
    apiStream = await client.beta.messages.create({ ...params, stream: true })
  } catch (err) {
    return mapError(err)
  }
  request.signal?.addEventListener?.('abort', () => apiStream.controller?.abort())

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let stopReason = null
      let explanation = null
      try {
        for await (const ev of apiStream) {
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(ev.delta.text))
          } else if (ev.type === 'message_delta') {
            stopReason = ev.delta?.stop_reason ?? stopReason
            explanation = ev.delta?.stop_details?.explanation ?? explanation
          }
        }
        if (stopReason === 'refusal') {
          controller.enqueue(encoder.encode(`\n\n> **Error:** Claude declined to draft this document.${explanation ? ' ' + explanation : ''}`))
        } else if (stopReason === 'max_tokens') {
          controller.enqueue(encoder.encode('\n\n> **Note:** The draft reached the length limit and was cut off. Generate the remaining sections separately.'))
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n> **Error:** ${err?.message ?? 'stream failed'}`))
      } finally {
        controller.close()
      }
    },
    cancel() {
      apiStream.controller?.abort()
    },
  })

  return new Response(readable, {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
      'x-haven-model': MODEL,
    },
  })
}
