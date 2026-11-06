# Haven

Progressive web app — React + Vite front-end (`src/`), Vercel serverless back-end (`api/`).

See **[pipeline.md](pipeline.md)** for setup, the branch → PR → preview → production workflow, and deploy details.

```bash
npm install
npm run dev:api   # API + app on :3000
npm run dev       # front-end hot reload on :5173 (proxies /api to :3000)
```
