import { describe, expect, it, vi } from 'vitest'
import { createFbEventsRouteHandler } from './route-handler.js'

const OK_BODY = { events_received: 1, messages: [], fbtrace_id: 't' }

function mockFetch(body: unknown = OK_BODY, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
}

function buildRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/fb-events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      'user-agent': 'UA',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('createFbEventsRouteHandler (App Router)', () => {
  it('returns 400 when body is not JSON', async () => {
    const { POST } = createFbEventsRouteHandler({
      accessToken: 't',
      pixelId: 'p',
      fetch: mockFetch(),
    })
    const bad = new Request('https://example.com/api/fb-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(bad)
    expect(res.status).toBe(400)
  })

  it('returns 400 when eventName or eventId is missing', async () => {
    const { POST } = createFbEventsRouteHandler({
      accessToken: 't',
      pixelId: 'p',
      fetch: mockFetch(),
    })
    const res = await POST(buildRequest({ eventId: 'x' }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/eventName/)
  })

  it('forwards the event to Meta and returns 200', async () => {
    const fetchImpl = mockFetch()
    const { POST } = createFbEventsRouteHandler({
      accessToken: 'tok',
      pixelId: '999',
      fetch: fetchImpl,
      retries: 0,
    })
    const res = await POST(
      buildRequest({
        eventName: 'Purchase',
        eventId: 'order-1',
        emails: ['a@b.com'],
        value: 50,
        currency: 'USD',
      }),
    )
    expect(res.status).toBe(200)

    const sent = JSON.parse(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    )
    expect(sent.data[0].event_name).toBe('Purchase')
    expect(sent.data[0].event_id).toBe('order-1')
    expect(sent.data[0].user_data.client_ip_address).toBe('1.2.3.4')
    expect(sent.data[0].user_data.client_user_agent).toBe('UA')
    expect(sent.data[0].custom_data.value).toBe(50)
  })

  it('forwards a per-request testEventCode', async () => {
    const fetchImpl = mockFetch()
    const { POST } = createFbEventsRouteHandler({
      accessToken: 't',
      pixelId: 'p',
      fetch: fetchImpl,
      retries: 0,
    })
    await POST(
      buildRequest({
        eventName: 'PageView',
        eventId: 'e1',
        testEventCode: 'TEST42',
      }),
    )
    const sent = JSON.parse(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    )
    expect(sent.test_event_code).toBe('TEST42')
  })

  it('surfaces Meta errors with the right status code', async () => {
    const errBody = {
      error: {
        message: 'Invalid access token',
        type: 'OAuthException',
        code: 190,
        fbtrace_id: 'trace-bad',
      },
    }
    const fetchImpl = mockFetch(errBody, 400)
    const { POST } = createFbEventsRouteHandler({
      accessToken: 't',
      pixelId: 'p',
      fetch: fetchImpl,
      retries: 0,
    })
    const res = await POST(buildRequest({ eventName: 'Lead', eventId: 'e1' }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; fbtraceId: string }
    expect(body.error).toBe('Invalid access token')
    expect(body.fbtraceId).toBe('trace-bad')
  })
})
