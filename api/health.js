// Example back-end endpoint. Every file in /api becomes a serverless function:
//   api/health.js  ->  GET /api/health
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    env: process.env.VERCEL_ENV ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    time: new Date().toISOString(),
  })
}
