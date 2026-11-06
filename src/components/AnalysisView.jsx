import { typeLabel } from '../lib/demo.js'

function Sev({ n }) {
  return (
    <span className={'dots' + (n <= 2 ? ' mild' : '')} title={`Severity ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  )
}

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
        </div>
      )}
      {incidents.length > 0 && (
        <div>
          <div className="section-title">Incidents ({incidents.length})</div>
          <div className="stack">
            {incidents.map((inc) => (
              <div key={inc.id} className="incident">
                <div className="row between">
                  <span className="row" style={{ gap: 6 }}><span className={'badge ' + (inc.severity >= 4 ? 'danger' : inc.severity >= 3 ? 'yellow' : 'purple')}>{typeLabel(inc.type)}</span><Sev n={inc.severity} /></span>
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
    </div>
  )
}
