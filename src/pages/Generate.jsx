import { useEffect, useState } from 'react'
import { navigate } from '../lib/router.js'
import { db } from '../lib/db.js'
import { fmtDate } from '../lib/media.js'
import { DOC_KINDS } from '../lib/demo.js'
import { useApp } from '../App.jsx'
import { LEGAL_DISCLAIMER } from '../content/safetyText.js'
import { Doc, ChevR, Spark, Scale, List, Heart, Flag, Clock, Shield } from '../components/Icons.jsx'

const ICONS = { dvro: Scale, dv101: Doc, exhibit_list: List, advocate_summary: Heart, criminal_case: Flag, timeline: Clock, safety_plan: Shield, everything: Spark }

export default function Generate() {
  const { claudeMode } = useApp()
  const [count, setCount] = useState(null)
  const [docs, setDocs] = useState([])
  useEffect(() => {
    db.all().then((i) => setCount(i.length)).catch(() => setCount(0))
    db.docs().then(setDocs).catch(() => {})
  }, [])
  return (
    <>
      <div className="notice purple"><Spark />Claude drafts each document from your evidence and notes, using only what you recorded. {LEGAL_DISCLAIMER}</div>
      {count === 0 && <div className="notice warn">No evidence yet. You can still generate templates, but add recordings, texts, or notes first for a useful draft.</div>}
      <div className="list">
        {DOC_KINDS.map((d) => {
          const Icon = ICONS[d.kind] || Doc
          return (
            <button key={d.kind} className="list-item" onClick={() => navigate(`/generate/${d.kind}`)} style={d.kind === 'everything' ? { background: 'var(--yellow-soft)' } : undefined}>
              <span className={'ico' + (d.kind === 'everything' ? ' yellow' : '')}><Icon /></span>
              <span className="meta"><span className="t">{d.title}</span><span className="s" style={{ whiteSpace: 'normal' }}>{d.desc}</span></span>
              <ChevR className="chev" />
            </button>
          )
        })}
      </div>
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
      <div className="tiny" style={{ textAlign: 'center' }}>Claude: {claudeMode === 'live' ? 'connected' : claudeMode === 'key' ? 'using your key' : 'demo mode (templates)'}</div>
    </>
  )
}
