/**
 * Self-contained Meta Conversions API core. This package does NOT depend
 * on a separate Node.js CAPI package — everything it needs to talk to
 * `graph.facebook.com` lives here.
 */
export { FacebookCapiClient } from './client.js'
export type { SendOverrides } from './client.js'
export { FacebookCapiError, FacebookCapiNetworkError } from './errors.js'
export { sha256 } from './hash.js'
export type {
  ActionSource,
  AppData,
  FacebookCapiClientOptions,
  FacebookCapiErrorBody,
  FacebookCapiResponse,
  Content,
  CustomData,
  EventName,
  ServerEvent,
  StandardEventName,
  UserData,
} from './types.js'
