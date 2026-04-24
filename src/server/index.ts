export { createFbEventsRouteHandler } from './route-handler.js'
export type { CreateRouteHandlerOptions, RouteHandler } from './route-handler.js'
export { createFbEventsApiHandler } from './api-handler.js'
export type { CreateApiHandlerOptions, FbEventsApiHandler } from './api-handler.js'
export { signalsFromRequest, signalsFromNodeRequest, parseFbCookies } from './extract-request.js'
export type { RequestSignals } from './extract-request.js'
export { buildServerEvent } from './build-event.js'
export type { FbEventPayload } from '../shared/types.js'

// Re-export the CAPI core so users can reach FacebookCapiClient / FacebookCapiError / types
// without installing another package.
export { FacebookCapiClient, FacebookCapiError, FacebookCapiNetworkError, sha256 } from '../capi/index.js'
export type {
  ActionSource,
  AppData,
  FacebookCapiClientOptions,
  FacebookCapiErrorBody,
  FacebookCapiResponse,
  Content,
  CustomData,
  EventName,
  SendOverrides,
  ServerEvent,
  StandardEventName,
  UserData,
} from '../capi/index.js'
