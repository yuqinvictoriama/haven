import { useMemo, useRef, useState } from 'react'

// The front door. A working unit converter named "Convert". Holding "=" for two seconds
// opens the vault; nothing on this screen mentions it.

const CATS = {
  length: {
    label: 'Length',
    base: 'm',
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    names: { mm: 'Millimeters', cm: 'Centimeters', m: 'Meters', km: 'Kilometers', in: 'Inches', ft: 'Feet', yd: 'Yards', mi: 'Miles' },
    from: 'mi',
    to: 'km',
  },
  weight: {
    label: 'Weight',
    base: 'g',
    units: { mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237, st: 6350.29318 },
    names: { mg: 'Milligrams', g: 'Grams', kg: 'Kilograms', oz: 'Ounces', lb: 'Pounds', st: 'Stones' },
    from: 'lb',
    to: 'kg',
  },
  temperature: {
    label: 'Temp',
    units: { C: 1, F: 1, K: 1 },
    names: { C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' },
    from: 'F',
    to: 'C',
  },
  volume: {
    label: 'Volume',
    base: 'l',
    units: { ml: 0.001, l: 1, tsp: 0.00492892, tbsp: 0.0147868, floz: 0.0295735, cup: 0.236588, pt: 0.473176, qt: 0.946353, gal: 3.78541 },
    names: { ml: 'Milliliters', l: 'Liters', tsp: 'Teaspoons', tbsp: 'Tablespoons', floz: 'Fluid ounces (US)', cup: 'Cups (US)', pt: 'Pints (US)', qt: 'Quarts (US)', gal: 'Gallons (US)' },
    from: 'gal',
    to: 'l',
  },
}

function convert(cat, value, from, to) {
  if (!Number.isFinite(value)) return NaN
  if (cat === 'temperature') {
    const c = from === 'C' ? value : from === 'F' ? ((value - 32) * 5) / 9 : value - 273.15
    return to === 'C' ? c : to === 'F' ? (c * 9) / 5 + 32 : c + 273.15
  }
  const u = CATS[cat].units
  return (value * u[from]) / u[to]
}

function fmt(n) {
  if (!Number.isFinite(n)) return ''
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
  if (abs >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return Number(n.toPrecision(3)).toString()
}

const HOLD_MS = 2000

export default function Converter({ onUnlock, initialCategory }) {
  const [cat, setCat] = useState(() => (initialCategory && CATS[initialCategory] ? initialCategory : 'length'))
  const [value, setValue] = useState('12')
  const [units, setUnits] = useState(() => Object.fromEntries(Object.entries(CATS).map(([k, c]) => [k, { from: c.from, to: c.to }])))
  const [history, setHistory] = useState([])
  const timer = useRef(null)
  const held = useRef(false)

  const { from, to } = units[cat]
  const c = CATS[cat]
  const result = useMemo(() => convert(cat, parseFloat(value), from, to), [cat, value, from, to])
  const setUnit = (which, u) => setUnits((s) => ({ ...s, [cat]: { ...s[cat], [which]: u } }))
  const swap = () => setUnits((s) => ({ ...s, [cat]: { from: s[cat].to, to: s[cat].from } }))

  const record = () => {
    if (!Number.isFinite(result)) return
    const line = `${fmt(parseFloat(value))} ${from} = ${fmt(result)} ${to}`
    setHistory((h) => [line, ...h.filter((x) => x !== line)].slice(0, 5))
  }

  // Hold "=" for two seconds to open the vault. A quick tap just records the conversion.
  const holdStart = () => {
    held.current = false
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      held.current = true
      timer.current = null
      onUnlock?.()
    }, HOLD_MS)
  }
  const holdEnd = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
      if (!held.current) record()
    }
  }

  return (
    <div className="conv">
      <header className="conv-head">
        <span className="conv-brand"><RulerGlyph /> Convert</span>
      </header>
      <div className="seg">
        {Object.entries(CATS).map(([k, v]) => (
          <button key={k} className={cat === k ? 'active' : ''} onClick={() => setCat(k)}>{v.label}</button>
        ))}
      </div>
      <div className="card stack">
        <div className="conv-row">
          <input className="input conv-num" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Value" />
          <select className="select" value={from} onChange={(e) => setUnit('from', e.target.value)} aria-label="From unit">
            {Object.keys(c.units).map((u) => <option key={u} value={u}>{c.names[u]}</option>)}
          </select>
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={swap} aria-label="Swap units">⇅ swap</button>
        </div>
        <div className="conv-row">
          <div className="input conv-num conv-out" aria-live="polite">{fmt(result) || '–'}</div>
          <select className="select" value={to} onChange={(e) => setUnit('to', e.target.value)} aria-label="To unit">
            {Object.keys(c.units).map((u) => <option key={u} value={u}>{c.names[u]}</option>)}
          </select>
        </div>
        <button
          className="btn btn-primary btn-lg btn-block conv-eq"
          onPointerDown={holdStart}
          onPointerUp={holdEnd}
          onPointerLeave={holdEnd}
          onPointerCancel={holdEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Equals"
        >
          =
        </button>
      </div>
      {history.length > 0 && (
        <div className="card card-tight">
          <div className="section-title" style={{ marginTop: 0 }}>Recent</div>
          {history.map((h, i) => <div key={i} className="small" style={{ padding: '3px 0' }}>{h}</div>)}
        </div>
      )}
      <div className="card card-tight">
        <div className="section-title" style={{ marginTop: 0 }}>Quick reference</div>
        <div className="small muted" style={{ lineHeight: 1.7 }}>
          1 mi = 1.609 km · 1 in = 2.54 cm · 1 ft = 30.48 cm<br />
          1 lb = 453.6 g · 1 oz = 28.35 g · 1 st = 6.35 kg<br />
          1 gal (US) = 3.785 l · 1 cup (US) = 236.6 ml<br />
          °F = °C × 9/5 + 32
        </div>
      </div>
    </div>
  )
}

function RulerGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 22, height: 22 }}>
      <rect x="2" y="8" width="20" height="8" rx="2" />
      <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
    </svg>
  )
}
