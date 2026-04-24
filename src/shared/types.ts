import type { AppData, EventName } from '../capi/index.js'

/**
 * Wire shape for POSTs from the browser `fbEvent()` helper to the server
 * route handler. Keep flat and JSON-friendly — the server attaches IP, UA,
 * and cookies it can read itself.
 */
export interface FbEventPayload {
  eventName: EventName
  eventId: string
  eventSourceUrl?: string
  referrerUrl?: string
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
  /** Messaging / app identity signals. All sent unhashed. */
  madid?: string
  anonId?: string
  pageId?: string
  pageScopedUserId?: string
  ctwaClid?: string
  igAccountId?: string
  igSid?: string
  value?: number
  currency?: string
  contents?: Array<{
    id: string
    quantity?: number
    item_price?: number
    delivery_category?: 'in_store' | 'curbside' | 'home_delivery'
  }>
  content_ids?: Array<string | number>
  content_type?: 'product' | 'product_group'
  content_name?: string
  content_category?: string
  order_id?: string
  num_items?: number
  predicted_ltv?: number
  search_string?: string
  status?: string
  delivery_category?: 'in_store' | 'curbside' | 'home_delivery'
  /** Arbitrary custom data not covered above — merged onto custom_data. */
  customData?: Record<string, unknown>
  /** `app_data` for app-source events. */
  appData?: AppData
  /** Passes through to Meta's Test Events tab. */
  testEventCode?: string
}
