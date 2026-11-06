// GET /api/health -> { ok, env, commit, time, claude }
// `claude` is true when ANTHROPIC_API_KEY is configured on the server, so the UI
// can show live vs demo mode.
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    env: process.env.VERCEL_ENV ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    time: new Date().toISOString(),
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
  })
}
