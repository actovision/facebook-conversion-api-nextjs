import type { EventName } from '../capi/index.js'

/**
 * Wire shape for POSTs from the browser `fbEvent()` helper to the server
 * route handler. Keep flat and JSON-friendly — the server attaches IP, UA,
 * and cookies it can read itself.
 */
export interface FbEventPayload {
  eventName: EventName
  eventId: string
  eventSourceUrl?: string
  emails?: string[]
  phones?: string[]
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: 'm' | 'f'
  country?: string
  state?: string
  city?: string
  zip?: string
  externalId?: string | string[]
  value?: number
  currency?: string
  contents?: Array<{ id: string; quantity?: number; item_price?: number }>
  content_ids?: Array<string | number>
  content_type?: 'product' | 'product_group'
  content_name?: string
  content_category?: string
  order_id?: string
  num_items?: number
  predicted_ltv?: number
  search_string?: string
  /** Arbitrary custom data not covered above — merged onto custom_data. */
  customData?: Record<string, unknown>
  /** Passes through to Meta's Test Events tab. */
  testEventCode?: string
}
