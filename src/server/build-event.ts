import type {
  ActionSource,
  CustomData,
  ServerEvent,
  UserData,
} from '../capi/index.js'
import type { FbEventPayload } from '../shared/types.js'
import type { RequestSignals } from './extract-request.js'

/**
 * Turn the flat wire payload from the browser + the request-derived signals
 * into the structured `ServerEvent` the core `CapiClient` expects.
 */
export function buildServerEvent(
  payload: FbEventPayload,
  signals: RequestSignals,
  actionSource: ActionSource = 'website',
): ServerEvent {
  const userData: UserData = {
    emails: payload.emails,
    phones: payload.phones,
    firstName: payload.firstName,
    lastName: payload.lastName,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    country: payload.country,
    state: payload.state,
    city: payload.city,
    zip: payload.zip,
    externalId: payload.externalId,
    clientIpAddress: signals.clientIpAddress,
    clientUserAgent: signals.clientUserAgent,
    fbp: signals.fbp,
    fbc: signals.fbc,
  }

  const customData: CustomData = {
    ...(payload.value !== undefined ? { value: payload.value } : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(payload.contents ? { contents: payload.contents } : {}),
    ...(payload.content_ids ? { content_ids: payload.content_ids } : {}),
    ...(payload.content_type ? { content_type: payload.content_type } : {}),
    ...(payload.content_name ? { content_name: payload.content_name } : {}),
    ...(payload.content_category ? { content_category: payload.content_category } : {}),
    ...(payload.order_id ? { order_id: payload.order_id } : {}),
    ...(payload.num_items !== undefined ? { num_items: payload.num_items } : {}),
    ...(payload.predicted_ltv !== undefined ? { predicted_ltv: payload.predicted_ltv } : {}),
    ...(payload.search_string ? { search_string: payload.search_string } : {}),
    ...payload.customData,
  }

  return {
    eventName: payload.eventName,
    eventId: payload.eventId,
    eventSourceUrl: payload.eventSourceUrl,
    actionSource,
    userData,
    customData: Object.keys(customData).length > 0 ? customData : undefined,
  }
}
