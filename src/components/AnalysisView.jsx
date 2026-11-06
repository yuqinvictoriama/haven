import { typeLabel } from '../lib/demo.js'
import { HOTLINE, DANGER_NOW, SAFETY_CARD, LEGAL_DISCLAIMER } from '../content/safetyText.js'
import { Phone } from './Icons.jsx'

// Renders a /api/analyze result.
export default function AnalysisView({ a, compact = false }) {
  if (!a) return null
  const incidents = a.incidents || []
  return (
    <div className="stack">
      {a.summary && <div className="card card-tight"><div className="section-title" style={{ marginTop: 0 }}>Summary</div><p>{a.summary}</p></div>}
      {a.risk_flags?.length > 0 && (
        <div>
          <div className="section-title">Risk flags</div>
          <div className="chips">{a.risk_flags.map((f, i) => <span key={i} className="badge danger">{f}</span>)}</div>
          <div className="card card-tight" style={{ background: 'var(--danger-soft)', borderColor: 'transparent', marginTop: 10 }}>
            <div style={{ fontWeight: 650, color: 'var(--danger)' }}>{SAFETY_CARD.title}</div>
            <p className="small" style={{ margin: '4px 0 8px' }}>{SAFETY_CARD.intro}</p>
            <div className="btn-row">
              <a className="btn btn-sm" href={HOTLINE.tel} style={{ background: 'var(--surface)' }}><Phone /> {HOTLINE.phone}</a>
              <a className="btn btn-sm" href={DANGER_NOW.tel} style={{ background: 'var(--surface)' }}>{DANGER_NOW.text}</a>
            </div>
          </div>
        </div>
      )}
      {incidents.length > 0 && (
        <div>
          <div className="section-title">Incidents ({incidents.length})</div>
          <div className="stack">
            {incidents.map((inc) => (
              <div key={inc.id} className="incident">
                <div className="row between">
                  <span className="badge purple">{typeLabel(inc.type)}</span>
                  <span className="tiny">{inc.date_text || inc.date || 'date unknown'}{inc.speaker ? ` · ${inc.speaker}` : ''}</span>
                </div>
                <div className="q">“{inc.quote}”</div>
                {!compact && <div className="x">{inc.explanation}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {a.patterns?.length > 0 && (
        <div>
          <div className="section-title">Patterns</div>
          <div className="card card-tight stack" style={{ gap: 8 }}>
            {a.patterns.map((p, i) => (
              <div key={i}><div style={{ fontWeight: 650 }}>{p.name}</div><div className="small muted">{p.description}{p.incident_ids?.length ? ` (${p.incident_ids.join(', ')})` : ''}</div></div>
            ))}
          </div>
        </div>
      )}
      {!compact && a.suggested_exhibits?.length > 0 && (
        <div>
          <div className="section-title">Suggested exhibits</div>
          <div className="card card-tight stack" style={{ gap: 8 }}>
            {a.suggested_exhibits.map((p, i) => (
              <div key={i}><div style={{ fontWeight: 650 }}>{p.title}</div><div className="small muted">{p.description}</div></div>
            ))}
          </div>
        </div>
      )}
      {!compact && a.parties?.length > 0 && (
        <div className="tiny">Parties: {a.parties.map((p) => `${p.name} (${p.role})`).join(' · ')}{a.model ? ` · model: ${a.model}` : ''}</div>
      )}
      <div className="tiny" style={{ textAlign: 'center' }}>{LEGAL_DISCLAIMER}</div>
    </div>
  )
}
