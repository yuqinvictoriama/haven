# Haven

Haven is an installable progressive web app for people experiencing domestic violence: capture evidence discreetly on a phone, keep it on the device, and turn it into the documents an advocate, a court, or the police need. Live at https://haven-app-ochre.vercel.app.

**Disguise.** On the phone the app installs as **Convert**, a working unit converter with a ruler icon. Holding **=** for two seconds opens Haven; the Exit button returns to the converter. The web address is always `/`, so browser history and the address bar never show the vault. Icon shortcuts only open converter categories. Direct links such as `/capture?mode=audio&auto=1` still open the recorder (for Back Tap / Quick Tap shortcuts) and are then rewritten to `/`.

## What it does

- **Capture**: audio and video recording, photos (in-app camera or system camera), and timestamped notes. Launch shortcuts start recording immediately: `/capture?mode=audio&auto=1`. Shake-to-record and OS gestures (iPhone Back Tap, Pixel Quick Tap, Samsung RegiStar) are documented in [EDGE-SPEC.md](EDGE-SPEC.md).
- **Evidence vault**: upload texts, chat exports, call logs, screenshots, photos, recordings. Everything is stored in IndexedDB on the device, grouped by month, with notes, tags, dates, share and download.
- **Review notes with Claude** (`/review`): dated notes go to `/api/analyze`, which tags each entry, flags danger signs, and drafts a first-person DV-100 description with `[Entry N]` citations. Sample entries included.
- **Analyze with Claude** (`/analyze`): paste a message thread or attach screenshots; Claude returns incidents with verbatim quotes, dates, severity, patterns, risk flags, and suggested exhibits. Android share-target support (`/share`).
- **Generate with Claude** (`/generate`): DVRO request narrative (DV-100), DV-101 Description of Abuse, exhibit list, one-page advocate summary, criminal case packet, incident timeline, safety plan, and "Everything". Drafts stream in, are saved on the device, and can be copied, shared, downloaded, or printed to PDF.
- **Safety**: National Domestic Violence Hotline (call 1-800-799-7233, text START to 88788) on every main screen, an Exit button that leaves the site, no data leaves the phone except what you send to Claude or share, and one-tap delete-all.
- **Demo mode**: without an API key the app still works end to end with a sample thread, keyword analysis, and template documents.

Color scheme: muted yellow (`--yellow`) and light purple (`--purple`), light and dark themes. Tokens live in `src/index.css`.

## Code map

| Path | What |
|---|---|
| `src/pages/Converter.jsx` | The front door: unit converter, hold = to unlock |
| `src/lib/router.js` | In-memory router; the address stays `/` |
| `src/App.jsx` | Shell: converter or vault, top bar with Exit, tab bar, settings context |
| `src/pages/` | Home, Capture, Evidence, EvidenceDetail, Analyze, Generate, Generator, Settings |
| `src/lib/db.js` | IndexedDB (evidence, documents) and localStorage settings |
| `src/lib/api.js` | Client for `/api/parse` and streaming `/api/generate` |
| `src/pages/Review.jsx` | Client for `/api/analyze` (entries) with `src/content/safetyText.js` |
| `src/lib/demo.js` | Sample thread, demo analysis, template documents |
| `src/content/gestures.js` | Gesture setup guides shown in Settings |
| `api/` | Vercel serverless functions (see below) |

Progressive web app — React + Vite front-end (`src/`), Vercel serverless back-end (`api/`).

See **[pipeline.md](pipeline.md)** for setup, the branch → PR → preview → production workflow, and deploy details.

```bash
npm install
npm run dev:api   # API + app on :3000
npm run dev       # front-end hot reload on :5173 (proxies /api to :3000)
```

## API (`api/`)

Serverless functions on Vercel (Node, Web-standard `Request`/`Response` signature). Claude calls use `@anthropic-ai/sdk`, model `claude-opus-5-5`, effort `low`, with server-side refusal fallbacks enabled. Key resolution: `ANTHROPIC_API_KEY` env var, else the `x-haven-key` request header (a key the user pasted into Haven → Settings); with neither, endpoints return `401 {"error":"no_api_key"}` and the front end falls back to demo mode.

Errors are JSON `{ error, message }`: `400 bad_request|bad_json`, `401 no_api_key|bad_api_key`, `405`, `429 rate_limited`, `502 upstream|bad_output`, `503 refusal`.

### `GET /api/health`
`{ ok, env, commit, time, claude }` — `claude` is true when `ANTHROPIC_API_KEY` is set on the server.

### `POST /api/analyze` (entries)
Reviews dated journal entries: `{ entries: [{ n, date, text }] }` → `{ categories, safetyFlags, draft }`. Prompt lives in `prompts/analyze.js`; used by the Review notes screen (`/review`). See the header comment in `api/analyze.js`.

### `POST /api/parse`
Parses pasted messages / logs / screenshots into structured evidence (used by the Analyze texts screen).

```jsonc
// request
{ "text": "pasted messages (may be empty if images given)",
  "source": "sms|imessage|whatsapp|email|social|log|other",
  "context": "optional: who the parties are",
  "images": [{ "media_type": "image/png|image/jpeg|image/webp|image/gif", "data": "<base64, no data: prefix>" }] }
// text ≤ 60,000 chars, images ≤ 6
// response 200
{ "summary": "2-4 sentences",
  "parties": [{ "name": "", "role": "survivor|respondent|witness|other" }],
  "incidents": [{ "id": "i1", "date": "YYYY-MM-DD|null", "time": "HH:MM|null", "date_text": "as written|null",
                  "type": "threat|intimidation|harassment|physical|sexual|stalking|coercive_control|financial|isolation|property|child_related|other",
                  "severity": 1, "quote": "verbatim", "speaker": "", "explanation": "" }],
  "patterns": [{ "name": "", "description": "", "incident_ids": ["i1"] }],
  "risk_flags": ["threat to kill", "..."],
  "suggested_exhibits": [{ "title": "", "description": "", "incident_ids": [] }],
  "model": "claude-opus-5-5", "usage": { "input_tokens": 0, "output_tokens": 0 } }
```

### `POST /api/generate`
Drafts a document from saved evidence. Streams Markdown by default.

```jsonc
// request
{ "kind": "dvro|dv101|exhibit_list|advocate_summary|criminal_case|safety_plan|timeline|everything",
  "jurisdiction": "California",            // default
  "profile": { "name": "", "respondent": "", "relationship": "", "children": "" },   // free-form
  "evidence": [{ "id": "", "kind": "text|log|photo|recording|audio|screenshot|note", "title": "",
                 "capturedAt": "ISO", "notes": "", "text": "optional content/transcript", "analysis": null }],
  "notes": "extra instructions",
  "stream": true }
// response, stream=true: 200 `text/markdown; charset=utf-8`, body = raw Markdown text chunks (read with
//   response.body.getReader()). A mid-stream failure appends "\n\n> **Error:** ..." and ends the stream.
// response, stream=false: 200 { "markdown": "...", "model": "...", "usage": {...}, "stop_reason": "end_turn" }
```

Evidence items are numbered as exhibits in `capturedAt` order and cited as "(Exhibit 3, screenshot, 2026-03-02)". Functions have `maxDuration: 60` (vercel.json); `kind: "everything"` is the longest draft and may hit that limit on a Hobby project without Fluid compute — raise `maxDuration` to 300 if Fluid compute is enabled.
