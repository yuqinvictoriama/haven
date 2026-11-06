import { useEffect, useState } from 'react'
import { navigate } from '../lib/router.js'
import { db, loadSettings, saveSettings } from '../lib/db.js'
import { fmtDate } from '../lib/media.js'
import { DOC_KINDS } from '../lib/demo.js'
import { PATHS, pathsFor } from '../content/paths.js'
import { useApp } from '../App.jsx'
import { LEGAL_DISCLAIMER } from '../content/safetyText.js'
import { Doc, ChevR, Spark, Scale, List, Heart, Flag, Clock, Shield, Info } from '../components/Icons.jsx'

const ICONS = { dvro: Scale, dv101: Doc, exhibit_list: List, advocate_summary: Heart, criminal_case: Flag, timeline: Clock, safety_plan: Shield, everything: Spark }
const byKind = Object.fromEntries(DOC_KINDS.map((d) => [d.kind, d]))

export default function Generate() {
  const { claudeMode } = useApp()
  const [pathId, setPathId] = useState(() => loadSettings().docPath || 'dvro')
  const [count, setCount] = useState(null)
  const [docs, setDocs] = useState([])
  useEffect(() => {
    db.all().then((i) => setCount(i.length)).catch(() => setCount(0))
    db.docs().then((all) => setDocs(all.filter((d) => d.kind !== 'review'))).catch(() => {}) // the saved Review notes result isn't a document
  }, [])
  const choose = (id) => {
    setPathId(id)
    saveSettings({ ...loadSettings(), docPath: id })
  }
  const path = PATHS.find((p) => p.id === pathId) || PATHS[0]
  const everything = byKind.everything

  return (
    <>
      <div className="notice purple"><Spark />Claude drafts each document from your evidence and notes, using only what you recorded. {LEGAL_DISCLAIMER}</div>
      {count === 0 && <div className="notice warn">No evidence yet. You can still generate templates, but add recordings, texts, or notes first for a useful draft.</div>}

      <div className="seg">
        {PATHS.map((p) => (
          <button key={p.id} className={pathId === p.id ? 'active' : ''} onClick={() => choose(p.id)}>{p.label}</button>
        ))}
      </div>

      <div className="card card-tight">
        <div className="row between"><h3>{path.title} path</h3><span className="badge purple">{path.court}</span></div>
        <p className="small muted" style={{ marginTop: 6 }}>{path.intro}</p>
      </div>

      <div className="section-title">In the order they are usually done</div>
      <ol className="steps">
        {path.steps.map((s, i) => {
          if (s.info) {
            return (
              <li key={'i' + i} className="step info">
                <span className="step-num">{i + 1}</span>
                <span className="step-body">
                  <span className="step-title"><Info /> {s.info}</span>
                  <span className="step-desc">{s.detail}</span>
                  <span className="tiny">Happens at the court or police station, not in Haven.</span>
                </span>
              </li>
            )
          }
          const d = byKind[s.kind]
          const Icon = ICONS[s.kind] || Doc
          const both = pathsFor(s.kind).length > 1
          return (
            <li key={s.kind} className="step">
              <span className="step-num">{i + 1}</span>
              <button className="step-body step-doc" onClick={() => navigate(`/generate/${s.kind}`)}>
                <span className="row between" style={{ alignItems: 'flex-start' }}>
                  <span className="step-title"><span className="ico"><Icon /></span>{d.title}{both && <span className="badge yellow">Both paths</span>}</span>
                  <ChevR className="chev" />
                </span>
                <span className="step-desc">{d.desc}</span>
                <span className="step-why">{s.why}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <button className="list-item card" style={{ padding: 14, background: 'var(--yellow-soft)' }} onClick={() => navigate('/generate/everything')}>
        <span className="ico yellow"><Spark /></span>
        <span className="meta"><span className="t">{everything.title}</span><span className="s" style={{ whiteSpace: 'normal' }}>{everything.desc}</span></span>
        <ChevR className="chev" />
      </button>

      <button className="list-item card" style={{ padding: 14 }} onClick={() => navigate('/next-steps')}>
        <span className="ico"><Flag /></span>
        <span className="meta"><span className="t">Next steps after you file</span><span className="s" style={{ whiteSpace: 'normal' }}>Court hearings, working with the prosecutor, and finding a free lawyer.</span></span>
        <ChevR className="chev" />
      </button>

      {docs.length > 0 && (
        <>
          <div className="section-title">Previous drafts</div>
          <div className="list">
            {docs.map((d) => (
              <button key={d.id} className="list-item" onClick={() => navigate(`/generate/${d.kind}?doc=${d.id}`)}>
                <span className="ico"><Doc /></span>
                <span className="meta"><span className="t">{d.title}</span><span className="s">{fmtDate(d.createdAt)}{d.mode === 'demo' ? ' · demo' : ''}</span></span>
                <ChevR className="chev" />
              </button>
            ))}
          </div>
        </>
      )}
      <div className="tiny" style={{ textAlign: 'center' }}>Order and form names follow California court self-help guidance. Your court self-help center or advocate can confirm the steps for your county. Claude: {claudeMode === 'live' ? 'connected' : claudeMode === 'key' ? 'using your key' : 'demo mode (templates)'}</div>
    </>
  )
}
