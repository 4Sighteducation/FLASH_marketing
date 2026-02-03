const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const DEFAULT_ALLOWED_HOSTS = [
  'www.fl4shcards.com',
  'fl4shcards.com',
  'www.fl4sh.cards',
  'fl4sh.cards',
  'localhost',
  '127.0.0.1',
]

function getAllowedHosts() {
  const raw = process.env.TURNSTILE_ALLOWED_HOSTS || ''
  const extra = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return Array.from(new Set([...DEFAULT_ALLOWED_HOSTS, ...extra]))
}

function parseHost(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.host
  } catch {
    return null
  }
}

export function isAllowedOrigin(request: { headers: Headers }) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = parseHost(origin) || parseHost(referer)

  if (!host) return false

  const allowedHosts = getAllowedHosts()
  if (allowedHosts.includes(host)) return true

  if (process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true' && host.endsWith('.vercel.app')) {
    return true
  }

  return false
}

export async function verifyTurnstileToken(params: { token: string; ip?: string | null }) {
  const secret =
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    process.env.CF_TURNSTILE_SECRET_KEY

  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY not configured')
  }

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', params.token)
  if (params.ip) body.set('remoteip', params.ip)

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Turnstile verification failed: ${res.status} ${text}`)
  }

  const json = (await res.json()) as { success: boolean; [key: string]: any }
  return json
}

export function validateHoneypotAndTiming(params: { website?: string; formStartedAt?: number }) {
  if (params.website && String(params.website).trim().length > 0) {
    return 'Spam detected.'
  }

  if (!params.formStartedAt || !Number.isFinite(params.formStartedAt)) {
    return 'Invalid form timing.'
  }

  const elapsed = Date.now() - params.formStartedAt
  if (elapsed < 1000) {
    return 'Form submitted too quickly.'
  }

  return null
}
