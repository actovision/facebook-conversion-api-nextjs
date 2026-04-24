/**
 * Root entry — re-exports server + shared types only. Client helpers and
 * React components must be imported from their subpaths so Next.js can
 * route them to the right runtime:
 *
 *   import { fbEvent } from '@actovision/facebook-conversion-api-nextjs/client'
 *   import { FBPixelScript } from '@actovision/facebook-conversion-api-nextjs/components'
 *   import { createFbEventsRouteHandler } from '@actovision/facebook-conversion-api-nextjs/server'
 */

export {
  createFbEventsRouteHandler,
  createFbEventsApiHandler,
  buildServerEvent,
  signalsFromRequest,
  signalsFromNodeRequest,
  parseFbCookies,
  FacebookCapiClient,
  FacebookCapiError,
  FacebookCapiNetworkError,
  sha256,
} from './server/index.js'
export type {
  CreateRouteHandlerOptions,
  RouteHandler,
  CreateApiHandlerOptions,
  FbEventsApiHandler,
  RequestSignals,
  FbEventPayload,
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
} from './server/index.js'
