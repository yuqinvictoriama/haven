# Haven — Dev & Deploy Pipeline

Team: **@yuqinvictoriama** and **@ls26**
Repo: https://github.com/yuqinvictoriama/haven

## How it fits together

```
 feature branch ──push──► GitHub PR ──► CI (lint + build)          ─┐
                              │                                    │ both must pass
                              └──► Vercel Preview deploy (own URL) ─┘
                                            │
                                     merge PR into main
                                            │
                                            ▼
                               Vercel Production deploy (live URL)
```

| Piece | What | Where |
|---|---|---|
| Front-end | React + Vite, installable PWA (manifest + service worker via `vite-plugin-pwa`) | `src/`, `public/`, `vite.config.js` |
| Back-end | Vercel serverless functions. Each file in `api/` becomes an endpoint (`api/health.js` → `/api/health`) | `api/` |
| CI | GitHub Actions runs `npm ci`, `npm run lint`, and `npm run build` on every PR and every push to `main` | `.github/workflows/ci.yml` |
| Hosting | Vercel. Every PR gets a preview URL, and `main` deploys to the live site | `vercel.json` |
| Branch rules | `main` is protected: changes go through a PR and CI must pass (no review approval needed, so a PR can merge as soon as CI passes) | GitHub → Settings → Branches |

## One-time setup

### 1. Connect Vercel (Victoria, about 2 minutes)
1. Go to https://vercel.com/new and sign in **with GitHub**.
2. Import `yuqinvictoriama/haven`. Vercel reads `vercel.json`, so keep the defaults and click **Deploy**.
3. The live URL will be `https://haven-<something>.vercel.app`. Paste it here: **LIVE URL: _TBD_**
4. (Optional) Project → Settings → Members: invite Lily so she can see logs and env vars. Deploys work without this because the repo is public.

After this, Vercel deploys automatically. Nobody needs to run a deploy command.

### 2. GitHub access (Lily)
Accept the collaborator invite at https://github.com/yuqinvictoriama/haven/invitations.

### 3. Local setup (both)
```bash
git clone https://github.com/yuqinvictoriama/haven.git
cd haven
npm install
npx vercel login          # once per machine; only needed for running the API locally
npx vercel link           # pick the existing "haven" project
npx vercel env pull .env.local   # pulls shared secrets, if any
```

## Daily workflow

```bash
git checkout main && git pull
git checkout -b feat/short-name        # e.g. feat/login-ui, api/save-notes

# develop: run both in separate terminals
npm run dev:api     # back-end (/api) on http://localhost:3000
npm run dev         # front-end on http://localhost:5173, /api proxied to :3000
#  (or just `npm run dev:api` alone; vercel dev also serves the front-end on :3000)

git add -A && git commit -m "Add login screen"
git push -u origin feat/short-name
gh pr create --fill                    # or open the PR on github.com
```

On the PR:
- **CI** shows ✓ or ✗ (lint and build).
- **Vercel bot** comments a **preview URL**. Open it on your phone to test the real PWA.
- Squash-merge when it's green. Production goes live in about 1 minute.

### Splitting the work to avoid merge conflicts
- Front-end work goes in `src/`, back-end work in `api/`. Keep PRs small and merge often (several times an hour is fine during a hackathon).
- Agree on API shapes early: add a short comment at the top of each `api/*.js` file showing the request and response JSON.
- If `main` moved while you were working: `git pull origin main` on your branch, fix any conflicts, then push.

## Secrets / environment variables
- Never commit keys. `.env*` files are gitignored.
- **`ANTHROPIC_API_KEY`** (Claude, used by `api/analyze.js` and `api/generate.js`) must be set in **Vercel → Project → Settings → Environment Variables** for Production + Preview, or with `npx vercel env add ANTHROPIC_API_KEY production` (then `preview`). Without it the API returns `401 no_api_key` and the app runs in demo mode.
- Add secrets in **Vercel → Project → Settings → Environment Variables** (choose Production and/or Preview).
- Read them only in `api/` code: `process.env.MY_KEY`. Anything under `src/` is shipped to browsers. Only `VITE_`-prefixed vars reach the front-end, and they're public.
- Teammates get them locally with `npx vercel env pull .env.local`.

## Emergency: the live site is broken
- **Fastest:** Vercel dashboard → Deployments → pick the last good one → **⋯ → Promote to Production** (instant rollback).
- Then fix forward: `git revert <bad-sha>` on a branch → PR → merge.

## PWA notes
- The service worker only runs on built output (preview/production URLs or `npm run build && npm run preview`), not in `npm run dev`.
- `registerType: 'autoUpdate'`: installed apps pick up new deploys on next load.
- `/api/*` is never served from the SW cache.
- TODO before the demo: replace `public/favicon.svg` with real 192×192 and 512×512 PNG icons and list them in `vite.config.js` so the app installs cleanly on iOS and Android.

## Useful commands
| Command | Does |
|---|---|
| `npm run dev` | Front-end dev server (hot reload) |
| `npm run dev:api` | Local serverless API (and full app) via `vercel dev` on :3000 |
| `npm run lint` | Lint (same as CI) |
| `npm run build` | Production build (same as CI) |
| `npx vercel` | Manual preview deploy from your machine (rarely needed) |
| `npx vercel --prod` | Manual production deploy (avoid this; merge to `main` instead) |
