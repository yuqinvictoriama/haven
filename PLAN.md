# Haven: Plan

**Team:**
- Lily: Claude analysis (`api/`, `prompts/`, sample entries)
- Victoria: screens (`src/`)

Setup and workflow are in pipeline.md; rules are in CLAUDE.md. Every change goes:
- on a *branch* (a separate copy of the code to work on)
- into a *PR* (a request to merge it into `main`)
- through *CI* (automatic lint + build) and a Vercel *preview link* (a test copy of the site you can open on your phone)
- and is merged when CI is green.

## How the app moves
**Converter** → hold "=" for 2 s → **Vault** → Analyze → **Results**.
- **Quick exit** (on Vault and Results) goes to a blank converter.
- **Back** (on Results) goes to the vault.
- The web address never changes, so browser history doesn't reveal the vault.

## The handoff between screens and Claude (agree on this first)
`POST /api/analyze`
- **Sends:** `{ entries: [{ n, date, text }] }`
- **Gets back:**
  - `categories: [{ entry, labels }]`
  - `safetyFlags: [{ entry, reason }]`
  - `draft: ["…first-person sentence. [Entry 9]", …]`
  - `legalLinks: [{ category, subsections, text }]` (added later; new fields are only ever added, the ones above never change)
- **On failure:** `{ error: "friendly message" }`

Categories: Physical harm · Threats & intimidation · Isolation & control · Financial control.

## Version 1 (each step is one small PR that keeps the app working)
**Lily: Claude side (about 1 h 50 min)**
- **0. Connect to GitHub (15 min).** Join this folder to the team repo, add this plan, merge.
  *Check:* the PR shows a green CI check and a preview link, and PLAN.md is on GitHub.
- **1. Sample entries (15 min).** `src/data/sampleEntries.js`: 12 made-up short, casual notes from Serena, Sep 21–Nov 1, 2026, about Marcus, covering all four categories and getting worse over time. Entry 9: he grabs her neck.
  *Check:* CI is green, and Victoria's vault can show them.
- **2. Analyze function (40 min).**
  - `api/analyze.js` + `prompts/analyze.js` send the entries to Claude and return the JSON above.
  - The API key stays on the server.
  - The function drops any draft sentence that doesn't end in a real [Entry N].

  *Check:* run one command against the preview link. Entry 9 is flagged, every sentence ends in a real [Entry N], and a broken request gets the friendly error.
- **3. Fixed safety text (15 min).** One file with the wording Victoria's results screen shows:
  - hotline 1-800-799-7233
  - "If you are in danger now, call 911."
  - "This is not legal advice. Review with a court self-help center or advocate before filing."
  - Next steps: county court self-help center (form DV-100), talk to an advocate, "may be relevant to California Family Code section 6320".

  *Check:* the wording matches CLAUDE.md, with no scores and no "illegal".
- **4. Ground the analysis in data.**
  - `data/categories.js`: the four categories, each with a plain description (used in the prompt) and the 6320 subsections it may be relevant to.
  - `data/dangerSigns.js`: six danger signs with English keywords. An entry is flagged if Claude flags it *or* a keyword matches (keywords only add flags).
  - `legalLinks` is built in code, not by Claude: "… may be relevant to California Family Code section …".
  - Any draft sentence with "illegal" is dropped; a flag reason with "illegal" gets a calm generic sentence instead.
  - `scripts/testAnalyze.js`: the 12 samples plus 5 extras (an ordinary argument, a throat squeeze, a gun threat, money control, a threat in Spanish).
  - `data/law6320.js`: Fam. Code 6320(a) and (c), word for word from leginfo (pasted by Lily). The prompt includes it as background only; it is never quoted or shown.

  *Check:* `node --env-file=.env.local scripts/testAnalyze.js` shows ✓ on every row with an expectation, no "illegal", and every draft sentence ends in a real [Entry N].
- **5. Join-up with Victoria (25 min).** Connect her Analyze button to `/api/analyze` and do a full run on your phone.
  *Check:* go through each CLAUDE.md "Product rules" line on the real screens.

**Victoria: screens (suggested; she may already have her own)**
- **Converter:** length units, a tap converts, holding "=" for 2 s opens the vault. The tab title and installed app name say "Unit Converter", not "Haven".
  *Check:* 12 miles shows 19.31 km, and a quick tap never opens the vault.
- **Vault:** the entries list, an add-entry box (dated today) saved in browser storage, Analyze, and Quick exit.
  *Check:* add an entry, reload, and it's still there.
- **Results:**
  - a safety card (when anything is flagged, *or* when the analysis fails)
  - patterns grouped by category
  - the draft with [Entry N]
  - the not-legal-advice note and next steps
  - Back and Quick exit buttons

  *Check:* a full run-through.

## Needs from Victoria (ask now)
- An invite to the Vercel project, so Lily can add `ANTHROPIC_API_KEY` under Settings → Environment Variables (Production + Preview).
- If she can't invite Lily, she adds the key herself. Share it privately, never in GitHub.
- Note: don't run `npx vercel env pull .env.local` if you already have a `.env.local`. It overwrites the file.

## Testing on a phone
Every PR gets a Vercel preview link; open it on your phone. That's the real test, including the long-press and installing the app.

## Extras for later (in priority order)
1. Photo upload
2. Timeline view
3. Export page
4. `mostRecentIncident` in the DV-101 shape
5. `reviewWithAdvocate`: points to raise with an advocate
6. Check that quotes in the draft match the entry word for word
7. A rule for translating entries written in Spanish

## Under the hood
- **Model:** `claude-opus-5-5`, asked to return JSON in a fixed shape. If Claude declines a request, Anthropic automatically retries it on a backup model.
- **Errors:** they show a friendly message on screen and log details to the console.
- **Data:** `data/` holds the categories and danger signs. It's not in `api/` because every file there becomes its own endpoint.
