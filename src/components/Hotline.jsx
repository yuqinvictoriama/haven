import { Phone, Msg } from './Icons.jsx'

// The National Domestic Violence Hotline: 24/7, free, confidential.
export default function Hotline({ compact = false }) {
  return (
    <div className="hotline">
      <div>
        <div className="h">National Domestic Violence Hotline</div>
        {!compact && <div className="sub">24/7, free, confidential. If you are in immediate danger, call 911.</div>}
      </div>
      <div className="btns">
        <a className="btn" href="tel:18007997233"><Phone /> Call 1-800-799-7233</a>
        <a className="btn" href="sms:88788?&body=START"><Msg /> Text START to 88788</a>
      </div>
      <div className="sub">TTY 1-800-787-3224 · Chat at <a href="https://www.thehotline.org" target="_blank" rel="noopener">thehotline.org</a></div>
    </div>
  )
}
