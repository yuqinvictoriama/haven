// Demo content used when Claude is not configured, so every screen still works end to end.
// All names and events are fictional.

export const SAMPLE_TEXT = `[iMessage export — "J" — Feb 14 to Apr 2, 2026]

Feb 14, 2026 9:12 PM — J: where are you. you said you'd be home by 8
Feb 14, 2026 9:13 PM — Me: Still at Priya's, leaving soon
Feb 14, 2026 9:13 PM — J: Priya is poison. I told you I don't want you around her. Send me a photo of where you are right now
Feb 14, 2026 9:20 PM — J: you have 10 minutes

Feb 27, 2026 11:48 PM — J: I checked the bank app. $60 at Target?? you don't spend without asking me. I'm taking the card back tomorrow

Mar 3, 2026 7:02 AM — Me: You scared me last night. You can't grab my arm like that
Mar 3, 2026 7:05 AM — J: you fell. stop making things up. and if you tell your sister about this I swear you'll regret it
Mar 3, 2026 7:06 AM — J: remember what happened last time you ran your mouth

Mar 15, 2026 1:30 PM — J: I'm outside your work. come out. I know you're in there, I can see your car
Mar 15, 2026 1:41 PM — J: your manager looked at me funny. tell him to mind his business or I'll come back when he's alone

Mar 28, 2026 10:15 PM — J: if you leave me you will never see Ava again. I'll tell the court you're unstable. nobody will believe you
Mar 28, 2026 10:16 PM — J: I still have the gun in the truck, don't forget that

Apr 2, 2026 6:50 AM — J: I'm sorry about last night ok. it won't happen again. just don't go to the police, it will ruin everything for Ava`

export const DEMO_ANALYSIS = {
  summary:
    'This message thread shows a six-week pattern of controlling behavior, threats, and intimidation by "J" toward the author. It includes monitoring of location and spending, isolation from friends and family, a referenced physical incident on or about March 2, 2026, showing up uninvited at the author\'s workplace, threats involving the child (Ava), and a reference to a firearm. The final message is an apology paired with pressure not to contact police.',
  parties: [
    { name: 'Me (author)', role: 'survivor' },
    { name: 'J', role: 'respondent' },
    { name: 'Ava', role: 'other' },
    { name: 'Priya', role: 'witness' },
  ],
  incidents: [
    { id: 'i1', date: '2026-02-14', time: '21:12', date_text: 'Feb 14, 2026 9:12 PM', type: 'coercive_control', severity: 2, quote: 'Send me a photo of where you are right now … you have 10 minutes', speaker: 'J', explanation: 'Demands proof of location with a deadline; monitoring and control of movement, and isolation from a friend ("Priya is poison").' },
    { id: 'i2', date: '2026-02-27', time: '23:48', date_text: 'Feb 27, 2026 11:48 PM', type: 'financial', severity: 2, quote: "you don't spend without asking me. I'm taking the card back tomorrow", speaker: 'J', explanation: 'Financial control: surveilling bank activity and restricting access to money.' },
    { id: 'i3', date: '2026-03-02', time: null, date_text: '"last night" relative to Mar 3, 2026 7:02 AM', type: 'physical', severity: 4, quote: "You can't grab my arm like that / you fell. stop making things up", speaker: 'Me, J', explanation: 'Contemporaneous report of physical contact (grabbing the arm) followed by denial and minimization. Date inferred from "last night".' },
    { id: 'i4', date: '2026-03-03', time: '07:05', date_text: 'Mar 3, 2026 7:05 AM', type: 'threat', severity: 4, quote: "if you tell your sister about this I swear you'll regret it … remember what happened last time you ran your mouth", speaker: 'J', explanation: 'Threat of retaliation for disclosing abuse; references prior consequences, suggesting a history of violence.' },
    { id: 'i5', date: '2026-03-15', time: '13:30', date_text: 'Mar 15, 2026 1:30 PM', type: 'stalking', severity: 3, quote: "I'm outside your work. come out. I know you're in there, I can see your car", speaker: 'J', explanation: 'Unannounced appearance at the workplace with surveillance of the author\'s car.' },
    { id: 'i6', date: '2026-03-15', time: '13:41', date_text: 'Mar 15, 2026 1:41 PM', type: 'threat', severity: 3, quote: "tell him to mind his business or I'll come back when he's alone", speaker: 'J', explanation: 'Threat directed at a third party (the manager), a potential witness.' },
    { id: 'i7', date: '2026-03-28', time: '22:15', date_text: 'Mar 28, 2026 10:15 PM', type: 'child_related', severity: 4, quote: "if you leave me you will never see Ava again. I'll tell the court you're unstable. nobody will believe you", speaker: 'J', explanation: 'Threat to use the child and the court system as leverage to prevent separation.' },
    { id: 'i8', date: '2026-03-28', time: '22:16', date_text: 'Mar 28, 2026 10:16 PM', type: 'threat', severity: 5, quote: "I still have the gun in the truck, don't forget that", speaker: 'J', explanation: 'Reference to a firearm in the context of threats; a recognized lethality indicator and relevant to firearm relinquishment orders.' },
    { id: 'i9', date: '2026-04-02', time: '06:50', date_text: 'Apr 2, 2026 6:50 AM', type: 'coercive_control', severity: 3, quote: "just don't go to the police, it will ruin everything for Ava", speaker: 'J', explanation: 'Apology combined with pressure not to report; suggests an incident occurred the night of Apr 1 and shows an effort to suppress reporting.' },
  ],
  patterns: [
    { name: 'Monitoring and control', description: 'Tracking location, demanding photo proof, surveilling bank activity, and restricting money and friendships.', incident_ids: ['i1', 'i2'] },
    { name: 'Escalation over time', description: 'Moves from control (Feb) to a physical incident and threats (early Mar), stalking at work (mid Mar), and a firearm reference with threats about the child (late Mar).', incident_ids: ['i3', 'i4', 'i5', 'i7', 'i8'] },
    { name: 'Suppressing disclosure', description: 'Repeated threats or pressure against telling family, a manager, or police.', incident_ids: ['i4', 'i6', 'i9'] },
  ],
  risk_flags: ['Access to a firearm', 'Threats about the child / custody', 'Prior physical incident (arm grabbed)', 'Stalking at workplace', 'Escalation over six weeks', 'Threats against a third party', 'Pressure not to contact police'],
  suggested_exhibits: [
    { title: 'Exhibit A: Message thread Feb 14 – Apr 2, 2026', description: 'Full export with timestamps; highlight i1–i9.', incident_ids: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9'] },
    { title: 'Exhibit B: Photos of arm (Mar 3, 2026)', description: 'If taken, photos of any bruising from the Mar 2 incident, with dates.', incident_ids: ['i3'] },
    { title: 'Exhibit C: Workplace witness statement', description: 'Statement from the manager who saw J outside on Mar 15, 2026.', incident_ids: ['i5', 'i6'] },
    { title: 'Exhibit D: Bank statement Feb 2026', description: 'Shows the transaction referenced and the card being withheld.', incident_ids: ['i2'] },
  ],
  model: 'demo',
  usage: { input_tokens: 0, output_tokens: 0 },
}

export const DOC_KINDS = [
  {
    kind: 'dvro',
    title: 'Restraining Order Request',
    short: 'DV-100',
    desc: 'Draft answers for California form DV-100, the request for a Domestic Violence Restraining Order (DVRO).',
    detail: 'A DVRO is the court order that tells the other person to stop contacting you, stay away from you, and in some cases move out or give up firearms. Form DV-100 asks what happened most recently, what happened before, and which orders you want. This draft fills in those answers from your evidence, in your words, so you can copy them onto the form with an advocate or at the court self-help center.',
  },
  {
    kind: 'dv101',
    title: 'Description of Abuse',
    short: 'DV-101',
    desc: 'Draft for California form DV-101, the attachment that describes each incident in detail.',
    detail: 'Form DV-101 goes with DV-100 and gives the court a detailed account of each incident: the date, what was said or done, any injuries, weapons, police involvement, and witnesses. It lists the most recent incident first and cites the evidence that shows each one. Missing details are left as blanks for you to fill in, never guessed.',
  },
  {
    kind: 'exhibit_list',
    title: 'Exhibit List',
    short: 'Exhibits',
    desc: 'A numbered list of all your evidence over time, what each item shows, and the patterns across them.',
    detail: 'Courts, advocates, and police refer to evidence by exhibit number. This list numbers every item you select, gives its date and type, and says what it demonstrates. It then describes the patterns over time, such as escalation and how often incidents happen, and notes what is still worth collecting.',
  },
  {
    kind: 'advocate_summary',
    title: 'Advocate Summary',
    short: 'Summary',
    desc: 'One page for a domestic violence advocate: your situation, safety concerns, key dates, evidence, and what you are asking for.',
    detail: 'Advocates at shelters, hotlines, and court self-help centers often have limited time. This one-page summary gives them the situation, the safety concerns found in your evidence, a short timeline, a list of what evidence you have, what you want to happen next, and suggested next steps, so the first conversation can start from the facts.',
  },
  {
    kind: 'criminal_case',
    title: 'Criminal Case Packet',
    short: 'Criminal',
    desc: 'A statement and evidence index to hand to police or the District Attorney (DA), with the offenses they may consider.',
    detail: 'If you report to the police or the DA, this packet gives them a short summary, an incident-by-incident statement in your words, an index of your evidence, and any witnesses. It lists offenses they may consider and which parts of your evidence may be relevant to each. Haven does not decide what is a crime; that is for police and prosecutors.',
  },
  {
    kind: 'timeline',
    title: 'Timeline',
    short: 'Timeline',
    desc: 'Every incident in date order, with the exhibit that shows each one.',
    detail: 'A single table of every incident found in your evidence, oldest first, with the date, what happened, the type of abuse, and the exhibit number. It ends with a short note on how things changed over time. Useful on its own and as an attachment to any of the other documents.',
  },
  {
    kind: 'safety_plan',
    title: 'Safety Plan',
    short: 'Safety',
    desc: 'A personal plan for staying safer now, if you leave, and during the legal process, based on the risks found in your evidence.',
    detail: 'A safety plan is a practical list for yourself: safest rooms and exits, a code word with someone you trust, what to pack, how to handle devices and location sharing, and who to call. This draft starts from the specific risks found in your evidence and includes the hotline. Review it with an advocate.',
  },
  {
    kind: 'everything',
    title: 'Complete Packet',
    short: 'All',
    desc: 'All seven documents in one file: advocate summary, timeline, exhibit list, restraining order request, description of abuse, criminal case packet, and safety plan.',
    detail: 'Generates the seven documents above one after another and joins them into a single file with a table of contents. Takes a few minutes with Claude connected. Good for printing once and bringing to an advocate, the court, and the police.',
  },
]

const NOTE = '_This is not legal advice. Review with a court self-help center or advocate before filing._\n\n'
const TYPE_LABEL = { threat: 'Threat', intimidation: 'Intimidation', harassment: 'Harassment', physical: 'Physical abuse', sexual: 'Sexual abuse', stalking: 'Stalking', coercive_control: 'Coercive control', financial: 'Financial abuse', isolation: 'Isolation', property: 'Property damage', child_related: 'Child-related', other: 'Other' }
export const typeLabel = (t) => TYPE_LABEL[t] || t

function allIncidents(evidence) {
  const out = []
  evidence.forEach((e, idx) => {
    const inc = e.analysis?.incidents || []
    inc.forEach((i) => out.push({ ...i, exhibit: idx + 1, source: e }))
  })
  return out.sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')))
}
const d = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '[date]')
const P = (profile, k, fallback) => (profile?.[k]?.trim() ? profile[k].trim() : fallback)

function exhibitTable(evidence) {
  if (!evidence.length) return '_No evidence selected yet. Add recordings, photos, screenshots, or texts in the Evidence tab._\n'
  const rows = evidence.map((e, i) => `| ${i + 1} | ${d(e.capturedAt)} | ${e.kind} | ${e.title || '(untitled)'}${e.notes ? ' — ' + e.notes : ''} | ${e.analysis ? (e.analysis.incidents?.length || 0) + ' incident(s) identified' : 'Supports timeline'} |`)
  return '| Ex. | Date | Type | Description | What it shows |\n|---|---|---|---|---|\n' + rows.join('\n') + '\n'
}
function incidentList(evidence) {
  const inc = allIncidents(evidence)
  if (!inc.length) return '_No incidents have been identified yet. Analyze texts or screenshots to extract incidents, or add notes describing what happened._\n'
  return inc.map((i) => `### ${i.date_text || i.date || 'Date unknown'} — ${typeLabel(i.type)}\n> "${i.quote}"\n\n${i.explanation} _(Exhibit ${i.exhibit})_\n`).join('\n')
}
function timelineTable(evidence) {
  const inc = allIncidents(evidence)
  if (!inc.length) return '_No incidents identified yet._\n'
  return '| Date | Type | What happened | Exhibit |\n|---|---|---|---|\n' + inc.map((i) => `| ${i.date || i.date_text || '?'} | ${typeLabel(i.type)} | "${i.quote}" | ${i.exhibit} |`).join('\n') + '\n'
}
function flags(evidence) {
  const set = new Set()
  evidence.forEach((e) => (e.analysis?.risk_flags || []).forEach((f) => set.add(f)))
  return [...set]
}
function patterns(evidence) {
  const out = []
  evidence.forEach((e) => (e.analysis?.patterns || []).forEach((p) => out.push(p)))
  return out
}

export function demoDocument(kind, { evidence = [], profile = {}, jurisdiction = 'California', notes = '' }) {
  const me = P(profile, 'name', '[YOUR NAME]')
  const r = P(profile, 'respondent', '[RESPONDENT NAME]')
  const rel = P(profile, 'relationship', '[relationship, e.g. spouse / former partner]')
  const kids = P(profile, 'children', '')
  const fl = flags(evidence)
  const pats = patterns(evidence)
  const extra = notes ? `\n> Your notes: ${notes}\n` : ''

  const advocate = () => `# One-page summary for an advocate\n${NOTE}**Survivor:** ${me}  \n**Person causing harm:** ${r} (${rel})  \n**Children:** ${kids || '[none listed]'}  \n**Jurisdiction:** ${jurisdiction}  \n**Prepared:** ${d(new Date().toISOString())}\n${extra}\n## Situation\n${evidence[0]?.analysis?.summary || `[2–4 sentences: what is happening, how long, most recent incident.]`}\n\n## Immediate safety concerns\n${fl.length ? fl.map((f) => `- ${f}`).join('\n') : '- [List lethality indicators: weapons, strangulation, threats to kill, stalking, escalation, separation]'}\n\n## Timeline highlights\n${allIncidents(evidence).slice(-8).map((i) => `- **${i.date || i.date_text || '?'}** — ${typeLabel(i.type)}: "${i.quote}" (Ex. ${i.exhibit})`).join('\n') || '- [Add incidents]'}\n\n## Evidence on hand\n${evidence.map((e, i) => `- Ex. ${i + 1}: ${e.kind} — ${e.title || '(untitled)'} (${d(e.capturedAt)})`).join('\n') || '- [None yet]'}\n\n## What ${me} is asking for\n- [ ] Domestic violence restraining order (personal conduct, stay-away${kids ? ', child custody and visitation' : ''}, firearms)\n- [ ] Safety planning and shelter options\n- [ ] Help with a police report / criminal case\n\n## Suggested next steps\n1. Review this packet with an advocate.\n2. File DV-100 / DV-101 ${jurisdiction === 'California' ? 'with the Superior Court' : 'or the local equivalent'}.\n3. Keep adding evidence to Haven as it happens.\n\n---\nNational Domestic Violence Hotline: 1-800-799-7233 · Text START to 88788 · thehotline.org\n`

  const timeline = () => `# Incident timeline\n${NOTE}${timelineTable(evidence)}\n## Exhibits referenced\n${exhibitTable(evidence)}`

  const exhibits = () => `# Exhibit list\n${NOTE}**Case:** ${me} v. ${r}  \n**Prepared:** ${d(new Date().toISOString())}\n${extra}\n## Exhibits\n${exhibitTable(evidence)}\n## Patterns over time\n${pats.length ? pats.map((p) => `- **${p.name}.** ${p.description}`).join('\n') : '- [Patterns will appear here after texts or screenshots are analyzed: escalation, frequency, types of abuse.]'}\n\n## Gaps / still to collect\n- Photos of any injuries, dated\n- Witness contact details (friends, coworkers, family)\n- Police report numbers, medical records, prior court orders\n- Screenshots that show the sender's name/number and the date\n`

  const dvro = () => `# Request for Domestic Violence Restraining Order — draft narrative (DV-100)\n${NOTE}> ${jurisdiction === 'California' ? 'Judicial Council of California form DV-100.' : 'Adapt to the local petition form.'} Fill the form itself from these answers.\n${extra}\n## 1. Person asking for protection\n${me}\n\n## 2. Person you want protection from\n${r}\n\n## 3. Relationship\n${rel}\n\n## 4. Other protected people\n${kids ? `Children: ${kids}` : '[List children or household members, if any]'}\n\n## 5. Orders requested\n- [x] Personal conduct orders (no contact, harassment, threats, or stalking)\n- [x] Stay-away orders (home, work, school, vehicle${kids ? ', children\'s school' : ''})\n- [ ] Move-out order\n${kids ? '- [x] Child custody and visitation\n' : ''}- [x] Firearms: order to relinquish${fl.some((f) => /firearm|gun|weapon/i.test(f)) ? ' (a firearm is referenced in the evidence)' : ''}\n\n## 6. Most recent abuse\n${allIncidents(evidence).slice(-1).map((i) => `**Date:** ${i.date || i.date_text}  \n**What happened:** "${i.quote}" — ${i.explanation} (Exhibit ${i.exhibit})`).join('') || '[Date, what happened, injuries, weapons, witnesses]'}\n\n## 7. Past abuse\n${incidentList(evidence)}\n## 8. Why the orders are needed\n${fl.length ? `The evidence shows: ${fl.join('; ')}.` : '[Explain the fear of future harm and the pattern shown by the evidence.]'}\n\n## Exhibits attached\n${exhibitTable(evidence)}`

  const dv101 = () => `# DV-101 Description of Abuse — draft\n${NOTE}**Protected person:** ${me}  \n**Restrained person:** ${r}\n${extra}\n${allIncidents(evidence).reverse().map((i, n) => `## Incident ${n + 1}: ${i.date_text || i.date || '[date]'}\n**Date:** ${i.date || '[date]'}${i.time ? ` ${i.time}` : ''}  \n**What happened:** "${i.quote}" — ${i.explanation}  \n**Injuries:** [describe or "none"]  \n**Weapons:** ${/gun|firearm|knife|weapon/i.test(i.quote + i.explanation) ? 'Referenced in the message' : '[none / describe]'}  \n**Police called:** [yes/no, report #]  \n**Witnesses:** [names]  \n**Evidence:** Exhibit ${i.exhibit}\n`).join('\n') || '## Incident 1\n[Date] — [What happened] — [Injuries] — [Weapons] — [Police] — [Witnesses]\n'}`

  const criminal = () => `# Criminal case packet\n${NOTE}**Reporting party:** ${me}  \n**Suspect:** ${r} (${rel})  \n**Jurisdiction:** ${jurisdiction}\n${extra}\n## Offenses police or a prosecutor may consider (${jurisdiction === 'California' ? 'California Penal Code' : 'local law'})\n_Haven does not decide what is or is not a crime. This table only shows which elements your evidence may be relevant to._\n\n| Offense | Elements | Evidence that may be relevant |\n|---|---|---|\n| PC 422 Criminal threats | Willful threat to kill/injure; specific and unequivocal; caused sustained fear | ${allIncidents(evidence).some((i) => i.type === 'threat') ? 'See threat incidents' : 'None yet' } |\n| PC 273.5 Corporal injury to spouse/cohabitant/parent of child | Willful infliction of injury causing a traumatic condition | ${allIncidents(evidence).some((i) => i.type === 'physical') ? 'See physical incidents; document injuries' : 'None yet'} |\n| PC 243(e)(1) Domestic battery | Willful, harmful or offensive touching | ${allIncidents(evidence).some((i) => i.type === 'physical') ? 'See physical incidents' : 'None yet'} |\n| PC 646.9 Stalking | Repeated following/harassing plus a credible threat | ${allIncidents(evidence).some((i) => i.type === 'stalking') ? 'See stalking incidents' : 'None yet'} |\n| PC 653m Harassing electronic communications | Repeated obscene/threatening contact intended to annoy | ${allIncidents(evidence).some((i) => ['threat', 'harassment'].includes(i.type)) ? 'See threat and harassment incidents' : 'None yet'} |\n\n## Statement of incidents\n${incidentList(evidence)}\n## Evidence index\n${exhibitTable(evidence)}\n## Witnesses\n- [Name, relation, what they saw, contact]\n\n## Requested actions\n- Take a report and provide the report number\n- Emergency Protective Order (EPO) if appropriate\n- Firearm relinquishment / seizure where applicable\n`

  const safety = () => `# Safety plan\n${NOTE}**For:** ${me}\n${extra}\n## Risks identified\n${fl.length ? fl.map((f) => `- ${f}`).join('\n') : '- [Add from analysis]'}\n\n## Right now\n- Keep the phone charged; Haven is installed and the hotline is one tap away.\n- Identify the safest rooms (exits, no weapons) and the safest route out.\n- Agree a code word with ${kids ? 'the children and ' : ''}a trusted person.\n\n## If leaving\n- Go-bag: ID, cards, keys, medication, chargers, copies of important documents${kids ? ', children\'s items' : ''}.\n- Change passwords and check devices for location sharing.\n- Vary routines; tell work security what ${r} looks like.\n\n## Legal\n- File for a restraining order; keep a copy with you at all times.\n- Keep adding evidence in Haven as it happens.\n\n## Support\n- National Domestic Violence Hotline 1-800-799-7233, text START to 88788\n- Local advocate: [name/number]\n- Emergency: 911\n`

  const map = { advocate_summary: advocate, timeline, exhibit_list: exhibits, dvro, dv101, criminal_case: criminal, safety_plan: safety }
  if (kind === 'everything') {
    return `# Haven packet — ${me}\n${NOTE}## Contents\n1. Advocate summary\n2. Incident timeline\n3. Exhibit list\n4. DVRO request (DV-100)\n5. DV-101 Description of Abuse\n6. Criminal case packet\n7. Safety plan\n\n---\n\n` + ['advocate_summary', 'timeline', 'exhibit_list', 'dvro', 'dv101', 'criminal_case', 'safety_plan'].map((k) => map[k]()).join('\n\n---\n\n')
  }
  return (map[kind] || advocate)()
}

// Keyword-based preview analysis for demo mode (no Claude key). Rough on purpose.
const KEYWORDS = [
  [/\b(kill|dead|die|gun|knife|weapon|shoot|choke|strangle)\b/i, 'threat', 5],
  [/\b(regret|you'll see|you will see|pay for|sorry you|ruin you|destroy)\b/i, 'threat', 4],
  [/\b(hit|slap|punch|grab|grabbed|push|pushed|shove|threw|bruise|hurt you)\b/i, 'physical', 4],
  [/\b(never see|take the kids|custody|the court|unstable|unfit)\b/i, 'child_related', 4],
  [/\b(outside your|i can see|followed|watching you|know where you are|tracking)\b/i, 'stalking', 3],
  [/\b(where are you|who are you with|send me a photo|answer me|10 minutes|right now)\b/i, 'coercive_control', 2],
  [/\b(money|card|bank|account|spend|paid|allowance)\b/i, 'financial', 2],
  [/\b(your friends|your sister|your family|don't talk to|poison|nobody will believe)\b/i, 'isolation', 3],
  [/\b(don't go to the police|don't tell|keep your mouth|ruin everything)\b/i, 'coercive_control', 3],
  [/\b(stupid|worthless|crazy|pathetic|bitch|slut|whore|idiot)\b/i, 'harassment', 2],
]
export function heuristicAnalysis(text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const incidents = []
  for (const line of lines) {
    for (const [re, type, sev] of KEYWORDS) {
      if (re.test(line)) {
        const m = /(\d{4}-\d{2}-\d{2}|\b[A-Z][a-z]{2,8}\.? \d{1,2}(?:,? \d{4})?)/.exec(line)
        incidents.push({ id: 'i' + (incidents.length + 1), date: null, time: null, date_text: m ? m[1] : null, type, severity: sev, quote: line.slice(0, 220), speaker: '', explanation: `Contains language consistent with ${typeLabel(type).toLowerCase()} (keyword match; demo mode).` })
        break
      }
    }
  }
  const types = [...new Set(incidents.map((i) => i.type))]
  return {
    summary: incidents.length ? `Demo preview: ${incidents.length} message(s) matched language associated with ${types.map(typeLabel).join(', ').toLowerCase()}. Connect Claude for a real analysis with dates, parties, and legal relevance.` : 'Demo preview: no obvious keyword matches. Connect Claude for a real analysis.',
    parties: [],
    incidents,
    patterns: types.length > 1 ? [{ name: 'Multiple forms of abuse', description: `Messages show ${types.map(typeLabel).join(', ').toLowerCase()}.`, incident_ids: incidents.map((i) => i.id) }] : [],
    risk_flags: incidents.filter((i) => i.severity >= 4).map((i) => typeLabel(i.type)).filter((v, i, a) => a.indexOf(v) === i),
    suggested_exhibits: incidents.length ? [{ title: 'Exhibit A: this message thread', description: 'Export with timestamps and sender names visible.', incident_ids: incidents.map((i) => i.id) }] : [],
    model: 'demo',
    usage: { input_tokens: 0, output_tokens: 0 },
  }
}
