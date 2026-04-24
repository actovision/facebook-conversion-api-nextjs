/**
 * Pull the signals Meta wants (IP, UA, _fbp, _fbc, Referer) out of an
 * incoming Next.js request. Works for both App Router (web standard
 * Request/Headers) and Pages Router (NextApiRequest, which exposes
 * node-style headers).
 */

export interface RequestSignals {
  clientIpAddress: string | undefined
  clientUserAgent: string | undefined
  fbp: string | undefined
  fbc: string | undefined
  /** Value of the `Referer` header, if present. */
  referrerUrl: string | undefined
}

type HeaderGetter = (name: string) => string | undefined

export function extractSignals(
  getHeader: HeaderGetter,
  cookies: string | undefined,
  requestUrl?: string,
): RequestSignals {
  const fwd = getHeader('x-forwarded-for')
  const realIp = getHeader('x-real-ip')
  const cfIp = getHeader('cf-connecting-ip')
  const trueClientIp = getHeader('true-client-ip')
  const clientIpAddress = (
    cfIp ||
    trueClientIp ||
    fwd?.split(',')[0] ||
    realIp ||
    undefined
  )?.trim()

  const clientUserAgent = getHeader('user-agent') || undefined

  const referrerUrl = getHeader('referer') || getHeader('referrer') || undefined

  const parsedCookies = parseFbCookies(cookies)
  const fbp = parsedCookies.fbp
  let fbc = parsedCookies.fbc

  // Fallback: construct fbc from `fbclid` if the cookie is absent.
  // Format per Meta: `fb.1.{unixMs}.{fbclid}`.
  if (!fbc && requestUrl) {
    const fbclid = extractFbclid(requestUrl)
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
  }

  return { clientIpAddress, clientUserAgent, fbp, fbc, referrerUrl }
}

function extractFbclid(url: string): string | undefined {
  const q = url.indexOf('?')
  if (q === -1) return undefined
  const search = url.slice(q + 1)
  for (const pair of search.split('&')) {
    const idx = pair.indexOf('=')
    if (idx === -1) continue
    if (pair.slice(0, idx) === 'fbclid') {
      return decodeURIComponent(pair.slice(idx + 1))
    }
  }
  return undefined
}

/** Parse `_fbp` and `_fbc` out of a raw Cookie header value. */
export function parseFbCookies(cookieHeader: string | undefined): {
  fbp: string | undefined
  fbc: string | undefined
} {
  if (!cookieHeader) return { fbp: undefined, fbc: undefined }
  const out: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    if (key === '_fbp' || key === '_fbc') {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim())
    }
  }
  return { fbp: out._fbp, fbc: out._fbc }
}

/** App Router: from a web `Request`. */
export function signalsFromRequest(req: Request): RequestSignals {
  return extractSignals(
    (name) => req.headers.get(name) ?? undefined,
    req.headers.get('cookie') ?? undefined,
    req.url,
  )
}

/** Pages Router: from a `NextApiRequest` (structurally-typed to avoid a Next import here). */
interface NodeLikeRequest {
  url?: string
  headers: Record<string, string | string[] | undefined>
}

export function signalsFromNodeRequest(req: NodeLikeRequest): RequestSignals {
  const getHeader: HeaderGetter = (name) => {
    const raw = req.headers[name.toLowerCase()]
    if (Array.isArray(raw)) return raw[0]
    return raw
  }
  const cookie = getHeader('cookie')
  const host = getHeader('host')
  const fullUrl = req.url && host ? `https://${host}${req.url}` : req.url
  return extractSignals(getHeader, cookie, fullUrl)
}
