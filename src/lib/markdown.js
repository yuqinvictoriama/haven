// Minimal Markdown → HTML for generated documents (headings, lists, tables, quotes, emphasis, links, code).
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function inline(s) {
  let out = esc(s)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  return out
}
export function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n')
  const html = []
  let i = 0
  let para = []
  const flush = () => {
    if (para.length) {
      html.push('<p>' + inline(para.join(' ')) + '</p>')
      para = []
    }
  }
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (t.startsWith('```')) {
      flush()
      const buf = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++])
      i++
      html.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>')
      continue
    }
    if (!t) { flush(); i++; continue }
    const h = /^(#{1,6})\s+(.*)$/.exec(t)
    if (h) { flush(); html.push(`<h${h[1].length}>${inline(h[2].replace(/\s#+$/, ''))}</h${h[1].length}>`); i++; continue }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flush(); html.push('<hr>'); i++; continue }
    if (t.startsWith('>')) {
      flush()
      const buf = []
      while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].trim().replace(/^>\s?/, ''))
      html.push('<blockquote>' + renderMarkdown(buf.join('\n')) + '</blockquote>')
      continue
    }
    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush()
      const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => inline(c.trim()))
      const head = cells(lines[i])
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      html.push('<table><thead><tr>' + head.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>')
      continue
    }
    const ul = /^[-*+]\s+(.*)$/.exec(t)
    const ol = /^\d+[.)]\s+(.*)$/.exec(t)
    if (ul || ol) {
      flush()
      const tag = ul ? 'ul' : 'ol'
      const re = ul ? /^[-*+]\s+(.*)$/ : /^\d+[.)]\s+(.*)$/
      const items = []
      while (i < lines.length) {
        const m = re.exec(lines[i].trim())
        if (m) { items.push(m[1]); i++ }
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++ }
        else break
      }
      html.push(`<${tag}>` + items.map((x) => `<li>${inline(x)}</li>`).join('') + `</${tag}>`)
      continue
    }
    para.push(t)
    i++
  }
  flush()
  return html.join('\n')
}
