import { describe, expect, it } from 'vitest'
import {
  parseFbCookies,
  signalsFromNodeRequest,
  signalsFromRequest,
} from './extract-request.js'

describe('parseFbCookies', () => {
  it('returns undefined for both when header is missing', () => {
    expect(parseFbCookies(undefined)).toEqual({ fbp: undefined, fbc: undefined })
  })

  it('extracts _fbp and _fbc from a cookie header', () => {
    const header = '_fbp=fb.1.111.222; _fbc=fb.1.abc.def; other=x'
    expect(parseFbCookies(header)).toEqual({ fbp: 'fb.1.111.222', fbc: 'fb.1.abc.def' })
  })

  it('URL-decodes values', () => {
    const header = '_fbc=fb.1.a%2Bb.c'
    expect(parseFbCookies(header).fbc).toBe('fb.1.a+b.c')
  })
})

describe('signalsFromRequest (App Router style)', () => {
  it('picks the first IP from x-forwarded-for and the full UA', () => {
    const req = new Request('https://example.com/api/fb-events', {
      headers: {
        'x-forwarded-for': '203.0.113.42, 10.0.0.1',
        'user-agent': 'Mozilla/5.0 Test',
        cookie: '_fbp=fb.1.xx.yy',
      },
    })
    const signals = signalsFromRequest(req)
    expect(signals.clientIpAddress).toBe('203.0.113.42')
    expect(signals.clientUserAgent).toBe('Mozilla/5.0 Test')
    expect(signals.fbp).toBe('fb.1.xx.yy')
    expect(signals.fbc).toBeUndefined()
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('https://example.com/', {
      headers: { 'x-real-ip': '198.51.100.9' },
    })
    expect(signalsFromRequest(req).clientIpAddress).toBe('198.51.100.9')
  })
})

describe('signalsFromNodeRequest (Pages Router style)', () => {
  it('handles the node-style headers record', () => {
    const signals = signalsFromNodeRequest({
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'user-agent': 'UA',
        cookie: '_fbp=fb.1.x.y; _fbc=fb.1.a.b',
      },
    })
    expect(signals).toEqual({
      clientIpAddress: '1.2.3.4',
      clientUserAgent: 'UA',
      fbp: 'fb.1.x.y',
      fbc: 'fb.1.a.b',
    })
  })

  it('flattens array-valued headers (set-cookie pattern)', () => {
    const signals = signalsFromNodeRequest({
      headers: {
        'x-forwarded-for': ['9.9.9.9', 'ignored'],
      },
    })
    expect(signals.clientIpAddress).toBe('9.9.9.9')
  })
})
