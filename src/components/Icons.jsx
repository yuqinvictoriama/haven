// Stroke icons, 24x24. Keep the set small and consistent.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true }
const I = (d) => (props) => (
  <svg {...S} {...props}>
    {d}
  </svg>
)
export const Mic = I(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>)
export const Camera = I(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.2" /></>)
export const Video = I(<><rect x="3" y="7" width="13" height="10" rx="2" /><path d="M16 11l5-3v8l-5-3z" /></>)
export const Note = I(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>)
export const Msg = I(<><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>)
export const Upload = I(<><path d="M12 16V5M7 10l5-5 5 5" /><path d="M4 17v3h16v-3" /></>)
export const Home = I(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>)
export const Folder = I(<><path d="M3 6h6l2 2h10v11H3z" /></>)
export const Doc = I(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 12h7M9 16h7" /></>)
export const Cog = I(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>)
export const Exit = I(<><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></>)
export const Back = I(<path d="M15 5l-7 7 7 7" />)
export const ChevR = I(<path d="M9 5l7 7-7 7" />)
export const ChevD = I(<path d="M5 9l7 7 7-7" />)
export const Check = I(<path d="M5 12l5 5 9-10" />)
export const Trash = I(<><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /></>)
export const Share = I(<><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v8h14v-8" /></>)
export const Copy = I(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>)
export const Download = I(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 18v2h16v-2" /></>)
export const Phone = I(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />)
export const Alert = I(<><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5v.5" /></>)
export const Shield = I(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>)
export const Spark = I(<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>)
export const Stop = I(<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />)
export const Play = I(<path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" />)
export const Img = I(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>)
export const File = I(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></>)
export const Plus = I(<path d="M12 5v14M5 12h14" />)
export const X = I(<path d="M6 6l12 12M18 6L6 18" />)
export const Info = I(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>)
export const Print = I(<><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="9" rx="2" /><path d="M7 14h10v7H7z" /></>)
export const Pin = I(<><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></>)
export const Clock = I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const Phone2 = Phone
export const Wave = I(<path d="M3 12h2l2-6 3 12 3-9 2 6 2-3h4" />)
export const Scale = I(<><path d="M12 3v18M5 21h14M3 8h18" /><path d="M6 8l-3 7h6zM18 8l-3 7h6z" /></>)
export const Flag = I(<><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>)
export const List = I(<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.5M3 12h.5M3 18h.5" /></>)
export const Heart = I(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />)
export const Install = I(<><path d="M12 3v11M8 10l4 4 4-4" /><rect x="4" y="16" width="16" height="5" rx="1.5" /></>)

export function kindIcon(kind) {
  switch (kind) {
    case 'audio': return <Mic />
    case 'video': return <Video />
    case 'photo': return <Camera />
    case 'screenshot': return <Img />
    case 'text': return <Msg />
    case 'log': return <List />
    case 'note': return <Note />
    default: return <File />
  }
}
