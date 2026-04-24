/**
 * Pull the signals Meta wants (IP, UA, _fbp, _fbc) out of an incoming
 * Next.js request. Works for both App Router (web standard Request/Headers)
 * and Pages Router (NextApiRequest, which exposes node-style headers).
 */

export interface RequestSignals {
  clientIpAddress: string | undefined
  clientUserAgent: string | undefined
  fbp: string | undefined
  fbc: string | undefined
}

type HeaderGetter = (name: string) => string | undefined

export function extractSignals(getHeader: HeaderGetter, cookies: string | undefined): RequestSignals {
  const fwd = getHeader('x-forwarded-for')
  const realIp = getHeader('x-real-ip')
  const clientIpAddress = (fwd?.split(',')[0] || realIp || undefined)?.trim()

  const clientUserAgent = getHeader('user-agent') || undefined

  const { fbp, fbc } = parseFbCookies(cookies)

  return { clientIpAddress, clientUserAgent, fbp, fbc }
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
  )
}

/** Pages Router: from a `NextApiRequest` (structurally-typed to avoid a Next import here). */
interface NodeLikeRequest {
  headers: Record<string, string | string[] | undefined>
}

export function signalsFromNodeRequest(req: NodeLikeRequest): RequestSignals {
  const getHeader: HeaderGetter = (name) => {
    const raw = req.headers[name.toLowerCase()]
    if (Array.isArray(raw)) return raw[0]
    return raw
  }
  const cookie = getHeader('cookie')
  return extractSignals(getHeader, cookie)
}
