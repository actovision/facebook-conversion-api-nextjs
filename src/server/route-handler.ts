import {
  FacebookCapiClient,
  CapiError,
  type ActionSource,
  type FacebookCapiClientOptions,
} from '../capi/index.js'
import { buildServerEvent } from './build-event.js'
import { signalsFromRequest } from './extract-request.js'
import type { FbEventPayload } from '../shared/types.js'

export interface CreateRouteHandlerOptions extends FacebookCapiClientOptions {
  /** Default action_source. Defaults to `'website'`. */
  actionSource?: ActionSource
  /**
   * Called with the final ServerEvent before it's sent. Return a replacement
   * to customize (e.g. attach a backend-only event_id, enrich user_data).
   */
  transformEvent?: (event: ReturnType<typeof buildServerEvent>) => ReturnType<typeof buildServerEvent>
  /** If true, include the payload + Meta response in the JSON response. Default false. */
  debug?: boolean
}

export interface RouteHandler {
  POST: (req: Request) => Promise<Response>
}

/**
 * Create a Next.js App Router handler:
 *
 * ```ts
 * // app/api/fb-events/route.ts
 * export const { POST } = createFbEventsRouteHandler({
 *   accessToken: process.env.FB_ACCESS_TOKEN!,
 *   pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
 * })
 * ```
 */
export function createFbEventsRouteHandler(options: CreateRouteHandlerOptions): RouteHandler {
  const { actionSource = 'website', transformEvent, debug = false, ...clientOptions } = options
  const client = new FacebookCapiClient(clientOptions)

  return {
    async POST(req: Request): Promise<Response> {
      let payload: FbEventPayload
      try {
        payload = (await req.json()) as FbEventPayload
      } catch {
        return json({ error: 'Invalid JSON body' }, 400)
      }
      if (!payload?.eventName) {
        return json({ error: 'Missing required field: eventName' }, 400)
      }
      if (!payload.eventId) {
        return json({ error: 'Missing required field: eventId' }, 400)
      }

      const signals = signalsFromRequest(req)
      let event = buildServerEvent(payload, signals, actionSource)
      if (transformEvent) event = transformEvent(event)

      try {
        const response = await client.trackEvent(
          event,
          payload.testEventCode ? { testEventCode: payload.testEventCode } : undefined,
        )

        return json(
          debug ? { success: true, response, event } : { success: true },
          200,
        )
      } catch (err) {
        if (err instanceof CapiError) {
          return json(
            { success: false, error: err.message, fbtraceId: err.fbtraceId },
            err.status,
          )
        }
        return json({ success: false, error: 'Upstream request failed' }, 502)
      }
    },
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
