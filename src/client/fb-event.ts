'use client'

import type { FbEventPayload } from '../shared/types.js'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export interface FbEventOptions extends Omit<FbEventPayload, 'eventId' | 'eventSourceUrl'> {
  /** If omitted, a random eventId is generated. */
  eventId?: string
  /** If omitted, `window.location.href` is used. */
  eventSourceUrl?: string
  /** Also fire the Meta Pixel (`window.fbq`) on the client. Default true. */
  enableStandardPixel?: boolean
  /** Delay (ms) between firing the pixel and POSTing to the server, to let
   *  the browser-side event commit first. Default 250. */
  serverSideDelayMs?: number
  /** Route to POST to. Default '/api/fb-events'. */
  serverPath?: string
}

export interface FbEventResult {
  eventId: string
  serverResponse: Response | undefined
}

/** Generate an eventId. Uses `crypto.randomUUID` if available, else a short random hex. */
function generateEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

/**
 * Fire a Meta Conversions event — both client-side pixel and server-side CAPI.
 * Both deliveries share the same `eventId` so Meta deduplicates them.
 */
export async function fbEvent(options: FbEventOptions): Promise<FbEventResult> {
  const {
    eventId: providedEventId,
    eventSourceUrl,
    enableStandardPixel = true,
    serverSideDelayMs = 250,
    serverPath = '/api/fb-events',
    ...rest
  } = options

  const eventId = providedEventId ?? generateEventId()
  const url = typeof window !== 'undefined' ? (eventSourceUrl ?? window.location.href) : eventSourceUrl

  if (enableStandardPixel && typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const pixelPayload: Record<string, unknown> = {}
    if (rest.value !== undefined) pixelPayload.value = rest.value
    if (rest.currency) pixelPayload.currency = rest.currency
    if (rest.contents) pixelPayload.contents = rest.contents
    if (rest.content_ids) pixelPayload.content_ids = rest.content_ids
    if (rest.content_type) pixelPayload.content_type = rest.content_type
    if (rest.content_name) pixelPayload.content_name = rest.content_name
    if (rest.content_category) pixelPayload.content_category = rest.content_category
    if (rest.order_id) pixelPayload.order_id = rest.order_id
    if (rest.num_items !== undefined) pixelPayload.num_items = rest.num_items
    if (rest.search_string) pixelPayload.search_string = rest.search_string

    window.fbq('track', rest.eventName, pixelPayload, { eventID: eventId })
  }

  if (serverSideDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, serverSideDelayMs))
  }

  const body: FbEventPayload = {
    ...rest,
    eventId,
    eventSourceUrl: url,
  }

  let response: Response | undefined
  try {
    response = await fetch(serverPath, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
  } catch {
    // Swallow — we don't want tracking to break the UX. Caller can check
    // `serverResponse` if they want to surface failures.
  }

  return { eventId, serverResponse: response }
}
