// Shared Claude helpers for the Haven API. Leading underscore keeps Vercel from
// exposing this file as a route.
import Anthropic from '@anthropic-ai/sdk'

export const MODEL = 'claude-opus-5-5'
// Server-side refusal fallback: if the model's safety classifiers decline, the
// API re-runs the request on Anthropic's recommended substitute model.
export const BETAS = ['server-side-fallback-2026-07-01']

export const HOTLINE_FOOTER =
  'National Domestic Violence Hotline: call 1-800-799-7233 (1-800-799-SAFE), text START to 88788, or chat at thehotline.org. In an emergency call 911.'

// Key resolution: Vercel env var first, then a key the user pasted into
// Haven → Settings (sent as the x-haven-key header, stored only in their browser).
export function resolveKey(request) {
  const env = process.env.ANTHROPIC_API_KEY
  if (env && env.trim()) return { key: env.trim(), source: 'env' }
  const header = request.headers.get('x-haven-key')
  if (header && header.trim()) return { key: header.trim(), source: 'header' }
  return null
}

export function makeClient(apiKey) {
  // 55s client timeout keeps us inside the 60s function budget (vercel.json).
  return new Anthropic({ apiKey, maxRetries: 1, timeout: 55_000 })
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export function noKey() {
  return json(401, {
    error: 'no_api_key',
    message: 'Add ANTHROPIC_API_KEY in Vercel, or paste a key in Haven → Settings.',
  })
}

export function methodNotAllowed() {
  return json(405, { error: 'method_not_allowed', message: 'Use POST.' })
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function mapError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return json(401, { error: 'bad_api_key', message: 'The Claude API key was rejected.' })
  }
  if (err instanceof Anthropic.RateLimitError) {
    return json(429, { error: 'rate_limited', message: 'Claude is rate-limited right now. Try again in a moment.' })
  }
  if (err instanceof Anthropic.APIError) {
    return json(502, { error: 'upstream', message: `Claude API error${err.status ? ` ${err.status}` : ''}: ${err.message}` })
  }
  return json(500, { error: 'server', message: err?.message ?? 'Unknown error' })
}

export function usageOf(message) {
  return {
    input_tokens: message?.usage?.input_tokens ?? 0,
    output_tokens: message?.usage?.output_tokens ?? 0,
  }
}

export function textOf(message) {
  return (message?.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
