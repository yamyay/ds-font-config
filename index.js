/**
 * Host half of the ds-font-config bundle.
 *
 * Typography state lives in the browser half (the settings page and the
 * injected style sheet), so most of this package needs no Host code. One thing
 * does: the OpenCode Go usage readout. The API key sits in the Host credential
 * seam, which the browser must never reach, so the Host resolves the key, asks
 * opencode.ai for the three rolling windows, and answers the browser with
 * percentages only.
 *
 * The route is a plain GET guarded by the composition's connection fence
 * (`requestRejection`): the Host/Origin check defeats DNS rebinding and the
 * login-token cookie gates every caller before a key is ever resolved.
 */

/** Cordis function-plugin name. */
export const name = 'ds-font-config'

/** The route carrier, the trust fence, and the credential seam. */
export const inject = ['webServer', 'credentials', 'connection']

/** Exact path the browser half polls after a turn settles. */
const USAGE_PATH = '/api/ds-font-config/opencode-usage'
/** OpenCode Go's API-key-authenticated usage endpoint. */
const USAGE_UPSTREAM = 'https://opencode.ai/zen/go/v1/usage'
/** Credential reference owned by the profile's `llm-pi-ai` route. */
const USAGE_CREDENTIAL = 'OPENCODE_GO_API_KEY'
/** Upstream deadline; the browser already retries on the next settled turn. */
const UPSTREAM_TIMEOUT_MS = 10_000
/** Collapse bursts of refreshes into one upstream read. */
const CACHE_MS = 5_000
/** The endpoint answers a few hundred bytes; anything larger is drift. */
const MAX_BYTES = 64 * 1024

/** One usage window, clamped to the percentage range the dashboard shows. */
function normalizeWindow(raw) {
  if (raw === null || typeof raw !== 'object') return null
  const percent = Number(raw.percent)
  if (!Number.isFinite(percent)) return null
  return {
    // A window marked `rate-limited` floors below 100 while reading as spent,
    // so the status travels with the number and the browser decides the tone.
    percent: Math.min(100, Math.max(0, percent)),
    status: typeof raw.status === 'string' ? raw.status : 'ok',
    resetsAt: typeof raw.resetsAt === 'string' ? raw.resetsAt : null,
  }
}

/** Project the upstream payload onto the three windows the browser renders. */
function normalizeUsage(payload) {
  const usage = payload !== null && typeof payload === 'object' ? payload.usage : undefined
  if (usage === null || typeof usage !== 'object') return null
  return {
    rolling: normalizeWindow(usage.rolling),
    weekly: normalizeWindow(usage.weekly),
    monthly: normalizeWindow(usage.monthly),
  }
}

/** Send one JSON body with no caching at any layer. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-length', String(Buffer.byteLength(body)))
  res.end(body)
}

/** Answer an untrusted or unauthenticated request; true when it was rejected. */
function rejected(ctx, req, res) {
  const connection = ctx.get('connection')
  if (connection === undefined) return false
  const rejection = connection.requestRejection(req)
  if (rejection === undefined) return false
  res.statusCode = rejection
  res.end()
  return true
}

/** Read the credential behind the profile's OpenCode Go route. */
async function resolveKey(ctx) {
  const resolved = await ctx.credentials.resolve(USAGE_CREDENTIAL)
  const value = resolved === undefined ? '' : String(resolved.value ?? '')
  return value === '' ? undefined : value
}

/**
 * Read the upstream usage document once.
 * @returns the normalized windows, or a tagged failure the route maps to a status.
 */
async function readUpstream(key) {
  let response
  try {
    response = await fetch(USAGE_UPSTREAM, {
      headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch (error) {
    return { failure: 'unreachable', detail: error instanceof Error ? error.message : String(error) }
  }
  if (response.status === 401) return { failure: 'rejected' }
  if (response.status === 403) return { failure: 'no-subscription' }
  if (!response.ok) return { failure: 'upstream', status: response.status }
  const text = await response.text()
  if (text.length > MAX_BYTES) return { failure: 'upstream', status: response.status }
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return { failure: 'shape' }
  }
  const usage = normalizeUsage(payload)
  return usage === null ? { failure: 'shape' } : { usage }
}

/**
 * Activate the usage bridge.
 * @param ctx - Host context carrying webServer, credentials, and connection.
 */
export function apply(ctx) {
  /** Last good windows plus the instant they were read. */
  let cached = null
  /** The in-flight read, so concurrent polls share one upstream request. */
  let inflight = null

  const usage = async () => {
    if (cached !== null && Date.now() - cached.at < CACHE_MS) return cached.result
    if (inflight !== null) return inflight
    inflight = (async () => {
      try {
        const key = await resolveKey(ctx)
        if (key === undefined) return { failure: 'unconfigured' }
        const result = await readUpstream(key)
        if (result.usage !== undefined) cached = { at: Date.now(), result }
        return result
      } catch (error) {
        return { failure: 'unreachable', detail: error instanceof Error ? error.message : String(error) }
      } finally {
        inflight = null
      }
    })()
    return inflight
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: USAGE_PATH,
    handler: async (req, res) => {
      if (rejected(ctx, req, res)) return
      if (req.method !== 'GET') {
        res.setHeader('allow', 'GET')
        sendJson(res, 405, { error: 'method-not-allowed' })
        return
      }
      const result = await usage()
      if (result.usage !== undefined) {
        sendJson(res, 200, { usage: result.usage })
        return
      }
      switch (result.failure) {
        case 'unconfigured':
          // No key is a setup state, not a failure: the browser hides the readout.
          sendJson(res, 200, { usage: null, reason: 'unconfigured' })
          return
        case 'rejected':
          sendJson(res, 401, { usage: null, reason: 'rejected' })
          return
        case 'no-subscription':
          sendJson(res, 403, { usage: null, reason: 'no-subscription' })
          return
        case 'shape':
          sendJson(res, 502, { usage: null, reason: 'shape' })
          return
        default:
          sendJson(res, 502, { usage: null, reason: 'unreachable' })
      }
    },
  }), `ds-font-config: GET ${USAGE_PATH}`)
}
