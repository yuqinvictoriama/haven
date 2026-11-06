import { navigate } from '../lib/router.js'
import Hotline from '../components/Hotline.jsx'
import Accordion from '../components/Accordion.jsx'
import { Heart, ChevR, Info } from '../components/Icons.jsx'
import { LEGAL_DISCLAIMER } from '../content/safetyText.js'
import { NEXT_STEPS_INTRO, NEXT_STEP_SECTIONS } from '../content/nextSteps.js'

export default function NextSteps() {
  return (
    <>
      <div className="notice purple"><Info />{LEGAL_DISCLAIMER}</div>

      <div className="card card-tight">
        <h3>After you file</h3>
        <p className="small muted" style={{ marginTop: 6 }}>{NEXT_STEPS_INTRO}</p>
      </div>

      <button className="list-item card" style={{ padding: 14, background: 'var(--yellow-soft)' }} onClick={() => navigate('/generate/advocate_summary')}>
        <span className="ico yellow"><Heart /></span>
        <span className="meta"><span className="t">Open your evidence summary</span><span className="s" style={{ whiteSpace: 'normal' }}>Your one-page Advocate Summary to bring to court, the DA’s office, or a lawyer.</span></span>
        <ChevR className="chev" />
      </button>

      <div className="section-title">Guidelines for what comes next</div>
      {NEXT_STEP_SECTIONS.map((s) => (
        <Accordion key={s.id} title={s.title} badge={<span className={'badge ' + (s.id === 'lawyer' ? 'yellow' : 'purple')}>{s.badge}</span>}>
          <p style={{ margin: '0 0 6px' }}>{s.intro}</p>
          <ol>
            {s.items.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </Accordion>
      ))}

      <Hotline />
    </>
  )
}
