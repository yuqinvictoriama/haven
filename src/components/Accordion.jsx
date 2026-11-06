import { useState } from 'react'
import { ChevD } from './Icons.jsx'

export default function Accordion({ title, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={'acc' + (open ? ' open' : '')}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="row" style={{ gap: 8 }}>{title}{badge}</span>
        <ChevD />
      </button>
      {open && <div className="body">{children}</div>}
    </div>
  )
}
