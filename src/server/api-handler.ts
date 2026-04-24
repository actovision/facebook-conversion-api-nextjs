import {
  FacebookCapiClient,
  FacebookCapiError,
  type ActionSource,
  type FacebookCapiClientOptions,
} from '../capi/index.js'
import { buildServerEvent } from './build-event.js'
import { signalsFromNodeRequest } from './extract-request.js'
import type { FbEventPayload } from '../shared/types.js'

export interface CreateApiHandlerOptions extends FacebookCapiClientOptions {
  actionSource?: ActionSource
  transformEvent?: (event: ReturnType<typeof buildServerEvent>) => ReturnType<typeof buildServerEvent>
  debug?: boolean
}

/**
 * Structural shape compatible with Next.js `NextApiRequest`/`NextApiResponse`
 * so we don't force consumers' versions of `next` onto the library's types.
 */
interface NodeLikeRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}
interface NodeLikeResponse {
  status: (code: number) => NodeLikeResponse
  json: (body: unknown) => void
}

export type FbEventsApiHandler = (
  req: NodeLikeRequest,
  res: NodeLikeResponse,
) => Promise<void>

/**
 * Create a Next.js Pages Router API handler:
 *
 * ```ts
 * // pages/api/fb-events.ts
 * export default createFbEventsApiHandler({
 *   accessToken: process.env.FB_ACCESS_TOKEN!,
 *   pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
 * })
 * ```
 */
export function createFbEventsApiHandler(
  options: CreateApiHandlerOptions,
): FbEventsApiHandler {
  const { actionSource = 'website', transformEvent, debug = false, ...clientOptions } = options
  const client = new FacebookCapiClient(clientOptions)

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' })
      return
    }

    const payload = parseBody(req.body) as FbEventPayload | undefined
    if (!payload?.eventName) {
      res.status(400).json({ error: 'Missing required field: eventName' })
      return
    }
    if (!payload.eventId) {
      res.status(400).json({ error: 'Missing required field: eventId' })
      return
    }

    const signals = signalsFromNodeRequest(req)
    let event = buildServerEvent(payload, signals, actionSource)
    if (transformEvent) event = transformEvent(event)

    try {
      const response = await client.trackEvent(
        event,
        payload.testEventCode ? { testEventCode: payload.testEventCode } : undefined,
      )
      res.status(200).json(debug ? { success: true, response, event } : { success: true })
    } catch (err) {
      if (err instanceof FacebookCapiError) {
        res
          .status(err.status)
          .json({ success: false, error: err.message, fbtraceId: err.fbtraceId })
        return
      }
      res.status(502).json({ success: false, error: 'Upstream request failed' })
    }
  }
}

function parseBody(body: unknown): unknown {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return undefined
    }
  }
  return body
}
