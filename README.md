# @actovision/facebook-conversion-api-nextjs

Next.js integration for [Meta's Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/). Supports **App Router** and **Pages Router**. Fully self-contained — talks to the Meta Graph API directly, no companion package required.

- Server-side CAPI handler (App Router **and** Pages Router)
- Browser helper `fbEvent()` that fires the pixel + the server event with matching `eventId` for automatic deduplication
- Meta Pixel `<Script>` loader and a pageview provider for each router
- Full parameter coverage: every standard event, every `user_data` field (including `madid`, `anon_id`, `ctwa_clid`, `ig_account_id`, `ig_sid`, `page_id`, `page_scoped_user_id`), `app_data` for app-source events, `referrer_url`, LDU/CCPA, test events, deduplication
- Auto-detects `cf-connecting-ip` / `x-real-ip` / `x-forwarded-for`, `Referer`, and reconstructs `fbc` from `fbclid` when the `_fbc` cookie is absent
- Defaults to Graph API **v22.0** — configurable via `apiVersion`
- Zero runtime dependencies — only `next` + `react` peers

## Install

```bash
pnpm add @actovision/facebook-conversion-api-nextjs
# peers: next >= 16, react >= 19 — node >= 22
```

## Environment

```
FB_ACCESS_TOKEN=<your server-only CAPI token>
NEXT_PUBLIC_FB_PIXEL_ID=<your pixel id>
```

## Subpath imports

Each subpath is bundled separately and tagged with the right runtime directive — pick the one that matches where the code runs.

| Subpath | Runtime | Use for |
| --- | --- | --- |
| `/server` | Node / Edge | Route handlers, `FacebookCapiClient`, signal extractors. |
| `/client` | Browser (`'use client'`) | `fbEvent()`, `fbPageView()`. |
| `/components` | Browser (`'use client'`) | `<FBPixelScript>`, `<FBPixelProvider>`, `<FBPixelProviderPages>`. |
| (root) | Node / Edge | Re-exports the `/server` surface for convenience. |

The root entry is server-only on purpose — importing it from a client component pulls in `node:crypto` and will break the build. Always import client helpers from `/client` and React components from `/components`.

## App Router setup

**1. Mount the pixel script + provider in your root layout**

```tsx
// app/layout.tsx
import { FBPixelScript, FBPixelProvider } from '@actovision/facebook-conversion-api-nextjs/components'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <FBPixelScript pixelId={process.env.NEXT_PUBLIC_FB_PIXEL_ID!} />
        <FBPixelProvider>{children}</FBPixelProvider>
      </body>
    </html>
  )
}
```

**2. Add the server route**

```ts
// app/api/fb-events/route.ts
import { createFbEventsRouteHandler } from '@actovision/facebook-conversion-api-nextjs/server'

export const { POST } = createFbEventsRouteHandler({
  accessToken: process.env.FB_ACCESS_TOKEN!,
  pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
})
```

**3. Fire events from client components**

```tsx
'use client'
import { fbEvent } from '@actovision/facebook-conversion-api-nextjs/client'

export function BuyButton() {
  return (
    <button
      onClick={() =>
        fbEvent({
          eventName: 'Purchase',
          emails: ['customer@example.com'],
          value: 99.99,
          currency: 'USD',
        })
      }
    >
      Buy
    </button>
  )
}
```

## Pages Router setup

```tsx
// pages/_app.tsx
import {
  FBPixelScript,
  FBPixelProviderPages,
} from '@actovision/facebook-conversion-api-nextjs/components'

export default function App({ Component, pageProps }) {
  return (
    <>
      <FBPixelScript pixelId={process.env.NEXT_PUBLIC_FB_PIXEL_ID!} />
      <FBPixelProviderPages>
        <Component {...pageProps} />
      </FBPixelProviderPages>
    </>
  )
}
```

```ts
// pages/api/fb-events.ts
import { createFbEventsApiHandler } from '@actovision/facebook-conversion-api-nextjs/server'

export default createFbEventsApiHandler({
  accessToken: process.env.FB_ACCESS_TOKEN!,
  pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
})
```

Client-side `fbEvent()` works identically.

## Standard events

Every Meta standard event is supported. `fbEvent()` fires both the browser pixel and the server event with the same `eventId` for automatic deduplication. Event names are case-sensitive — use the names exactly as shown.

```ts
'use client'
import { fbEvent } from '@actovision/facebook-conversion-api-nextjs/client'

// Purchase — completed transaction
fbEvent({
  eventName: 'Purchase',
  emails: ['customer@example.com'],
  phones: ['+1 555 123 4567'],
  value: 99.99,
  currency: 'USD',
  order_id: 'ORDER-12345',
  contents: [{ id: 'sku-1', quantity: 1, item_price: 99.99 }],
  content_ids: ['sku-1'],
  content_type: 'product',
})

// AddToCart — user added an item to cart
fbEvent({
  eventName: 'AddToCart',
  content_ids: ['sku-1'],
  contents: [{ id: 'sku-1', quantity: 1, item_price: 49.99 }],
  content_type: 'product',
  value: 49.99,
  currency: 'USD',
})

// InitiateCheckout — user started checkout
fbEvent({
  eventName: 'InitiateCheckout',
  content_ids: ['sku-1', 'sku-2'],
  num_items: 2,
  value: 79.98,
  currency: 'USD',
})

// AddPaymentInfo — user entered payment info
fbEvent({
  eventName: 'AddPaymentInfo',
  value: 79.98,
  currency: 'USD',
})

// ViewContent — user viewed a product / content page
fbEvent({
  eventName: 'ViewContent',
  content_ids: ['sku-1'],
  content_name: 'Running Shoes',
  content_category: 'Footwear',
  content_type: 'product',
  value: 49.99,
  currency: 'USD',
})

// Search — user performed a search
fbEvent({
  eventName: 'Search',
  search_string: 'running shoes',
  content_ids: ['sku-1', 'sku-2'],
  content_category: 'Footwear',
})

// Lead — form / quote submission
fbEvent({
  eventName: 'Lead',
  emails: ['lead@example.com'],
  phones: ['+1 555 000 1111'],
  content_name: 'Newsletter Signup',
  value: 0,
  currency: 'USD',
})

// CompleteRegistration — account created
fbEvent({
  eventName: 'CompleteRegistration',
  emails: ['new@example.com'],
  content_name: 'Free Plan',
  status: 'completed',
  value: 0,
  currency: 'USD',
})

// Subscribe — paid subscription started
fbEvent({
  eventName: 'Subscribe',
  emails: ['user@example.com'],
  value: 9.99,
  currency: 'USD',
  predicted_ltv: 120,
})

// StartTrial — free trial activated
fbEvent({
  eventName: 'StartTrial',
  emails: ['trial@example.com'],
  value: 0,
  currency: 'USD',
  predicted_ltv: 120,
})

// AddToWishlist — user saved item to wishlist
fbEvent({
  eventName: 'AddToWishlist',
  content_ids: ['sku-1'],
  value: 49.99,
  currency: 'USD',
})

// FindLocation — looked up a physical business location
fbEvent({ eventName: 'FindLocation', content_name: 'Downtown Store' })

// Schedule — booked an appointment
fbEvent({
  eventName: 'Schedule',
  emails: ['appt@example.com'],
  content_name: 'Consultation',
})

// SubmitApplication — applied for product/service
fbEvent({
  eventName: 'SubmitApplication',
  emails: ['applicant@example.com'],
  value: 0,
  currency: 'USD',
})

// Donate — donation completed
fbEvent({
  eventName: 'Donate',
  emails: ['donor@example.com'],
  value: 25,
  currency: 'USD',
})

// Contact — initiated contact (support, sales, etc.)
fbEvent({ eventName: 'Contact', emails: ['contact@example.com'] })

// PageView — usually auto-fired by FBPixelProvider. Call manually only for
// virtual page transitions your provider can't detect:
fbEvent({ eventName: 'PageView' })
```

Need a custom event? Pass any string for `eventName` — typed as `EventName = StandardEventName | (string & {})`.

## How deduplication works

`fbEvent()` generates a single `eventId`, fires `fbq('track', name, payload, { eventID })` on the client, waits a short moment (default 250 ms), then POSTs the same `eventId` to `/api/fb-events`. Meta collapses the two deliveries into one attributed event.

### `fbEvent()` advanced options

In addition to the event payload, `fbEvent()` accepts:

| Option | Default | Purpose |
| --- | --- | --- |
| `eventId` | random UUID | Override the dedup ID — useful if you already have one (order ID, session ID). |
| `eventSourceUrl` | `window.location.href` | Override the URL attached to the event. |
| `referrerUrl` | `document.referrer` | Override the referrer. |
| `enableStandardPixel` | `true` | Skip the browser pixel call and send only the server event. |
| `serverSideDelayMs` | `250` | Pause between firing the pixel and POSTing to the server. Set to `0` for fire-and-forget. |
| `serverPath` | `'/api/fb-events'` | Change the route the helper POSTs to. Match this to wherever you mounted the handler. |

```ts
await fbEvent({
  eventName: 'Purchase',
  eventId: order.id, // dedup against the order
  serverPath: '/api/conversions', // matches your custom route
  enableStandardPixel: false,     // server-only delivery
  value: order.total,
  currency: 'USD',
})
```

## API reference

### Client

| Symbol | Description |
| --- | --- |
| `fbEvent(options)` | Fire pixel + server event. Returns `{ eventId, serverResponse }`. |
| `fbPageView()` | Standard pixel PageView (client-only). |

### Server

| Symbol | Description |
| --- | --- |
| `createFbEventsRouteHandler(opts)` | App Router. Returns `{ POST }` for `app/api/fb-events/route.ts`. |
| `createFbEventsApiHandler(opts)` | Pages Router. Default export for `pages/api/fb-events.ts`. |
| `FacebookCapiClient` | Low-level client — call `trackEvent()` / `trackEvents()` directly without going through a route. |
| `FacebookCapiError`, `FacebookCapiNetworkError` | Thrown by the client for HTTP and network failures respectively. `FacebookCapiError` carries `status` and `fbtraceId`. |
| `buildServerEvent` | Build a `ServerEvent` from a flat payload — useful if you write your own handler. |
| `signalsFromRequest`, `signalsFromNodeRequest` | Pull IP, UA, `_fbp`, `_fbc`, `Referer` from a request (web `Request` and Node-style respectively). |
| `parseFbCookies` | Parse `_fbp` / `_fbc` from a raw `Cookie` header. |
| `sha256` | Lowercase 64-hex SHA-256 — exposed because Meta's PII hashing relies on the same shape. |

Both factory handlers accept every `FacebookCapiClientOptions` plus:
- `actionSource` — default for `action_source` (default `'website'`)
- `apiVersion` — Graph API version (default `'v22.0'`)
- `testEventCode` — Meta Test Events tab code; removed in production
- `timeoutMs` / `retries` — network tuning (defaults 10 s / 2 retries on 5xx)
- `transformEvent` — last-chance mutator before sending
- `debug` — echo the payload + Meta response in the HTTP response body
- `fetch`, `now` — injection points for tests

### Direct `FacebookCapiClient` usage

The route handlers are a convenience wrapper. For server-only flows (background jobs, webhooks, offline events) talk to the client directly:

```ts
import {
  FacebookCapiClient,
  FacebookCapiError,
} from '@actovision/facebook-conversion-api-nextjs/server'

const capi = new FacebookCapiClient({
  accessToken: process.env.FB_ACCESS_TOKEN!,
  pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
  apiVersion: 'v22.0',
})

// Persistent user data — merged into every subsequent event.
capi.setUserData({ country: 'us' })

try {
  const res = await capi.trackEvent({
    eventName: 'Purchase',
    eventId: 'ORDER-12345',
    eventSourceUrl: 'https://shop.example.com/checkout/success',
    actionSource: 'website',
    userData: {
      emails: ['customer@example.com'],
      phones: ['+15551234567'],
    },
    customData: { value: 99.99, currency: 'USD' },
  })
  console.log('events_received', res.events_received)
} catch (err) {
  if (err instanceof FacebookCapiError) {
    console.error(err.status, err.fbtraceId, err.message)
  }
}

// Batch up to 1000 events per request.
await capi.trackEvents([event1, event2, event3])
```

PII fields in `userData` (emails, phones, names, DOB, city, state, zip, country, externalId) are normalized to Meta's spec and SHA-256 hashed automatically. Already-hashed values (64-hex) are passed through unchanged.

### App events (`action_source: 'app'`)

Pass `appData` on either the client `fbEvent()` call or the server `ServerEvent`:

```ts
fbEvent({
  eventName: 'Purchase',
  value: 9.99,
  currency: 'USD',
  appData: {
    advertiserTrackingEnabled: 1,           // iOS ATT consent
    applicationTrackingEnabled: 1,
    extinfo: ['i2', 'com.example.app', '1.0', '1', '17.0', 'iPhone15,2', 'en_US', 'PST', 'Verizon', 390, 844, 3, 6, 8, 128],
    vendorId: 'vid-...',
  },
})
```

### Landing-page `fbclid` capture

When a user arrives from an ad without the `_fbc` cookie yet being set (e.g. no Pixel on the landing page), the server handler reconstructs `fbc` as `fb.1.{nowMs}.{fbclid}` from the request URL. No action required.

### Components

| Symbol | Description |
| --- | --- |
| `<FBPixelScript pixelId nonce? strategy? />` | Inline Meta Pixel init via `next/script`. `strategy` defaults to `'afterInteractive'`. Pass `nonce` if you run a strict CSP. |
| `<FBPixelProvider>` | **App Router** — fires PageView on pathname/searchParams change. |
| `<FBPixelProviderPages>` | **Pages Router** — fires PageView on `routeChangeComplete`. |

## Privacy controls (LDU / CCPA, opt-out)

Pass these directly on a `ServerEvent` (e.g. via `transformEvent`, or when calling `FacebookCapiClient` yourself):

- `optOut` — boolean; when `true`, Meta drops the event from optimization.
- `dataProcessingOptions` — array, e.g. `['LDU']` for Limited Data Use.
- `dataProcessingOptionsCountry` / `dataProcessingOptionsState` — `0` lets Meta geolocate, or pass a specific country/state code per Meta's docs.

```ts
createFbEventsRouteHandler({
  accessToken: process.env.FB_ACCESS_TOKEN!,
  pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID!,
  transformEvent: (event) => ({
    ...event,
    dataProcessingOptions: ['LDU'],
    dataProcessingOptionsCountry: 0,
    dataProcessingOptionsState: 0,
  }),
})
```

## Development

Contributions welcome. The project is plain TypeScript + Vitest, bundled with [tsup](https://tsup.egoist.dev/).

```bash
pnpm install
pnpm test          # vitest run
pnpm test:watch    # vitest --watch
pnpm typecheck     # tsc --noEmit
pnpm build         # tsup → ./dist (esm + cjs + .d.ts)
pnpm dev           # tsup --watch
pnpm clean         # rm -rf dist coverage
```

### Repo layout

```
src/
├── capi/         Self-contained Meta CAPI core — talks to graph.facebook.com directly.
│                 FacebookCapiClient, error classes, hashing, normalization, type defs.
├── server/       Next.js route handlers + request signal extraction.
│                 createFbEventsRouteHandler (App), createFbEventsApiHandler (Pages),
│                 buildServerEvent, signalsFromRequest, signalsFromNodeRequest.
├── client/       Browser helpers — fbEvent(), fbPageView(). Tagged 'use client'.
├── components/   React components — FBPixelScript, FBPixelProvider(Pages). Tagged 'use client'.
├── shared/       Cross-runtime types (FbEventPayload — the wire shape POSTed to the route).
└── index.ts      Root entry — re-exports the /server surface for convenience.
```

`src/capi/` has no Next.js dependency on purpose — it is reusable in any Node/Edge environment. `src/server/` is the Next.js-specific glue layer.

### Build pipeline

[tsup](https://tsup.egoist.dev/) emits ESM + CJS + `.d.ts` for four entries (`index`, `server/index`, `client/index`, `components/index`). Because esbuild strips `"use client"` directives during bundling, [scripts/add-use-client.mjs](./scripts/add-use-client.mjs) re-adds them post-build to every file under `dist/client/` and `dist/components/`, plus any shared `chunk-*.js` that references browser-only code (`window.fbq`, `next/script`, `next/navigation`, `next/router`). Keep that script in sync if you introduce new client-only chunks.

### Tests

Vitest covers:
- `capi/normalize.test.ts` — Meta's PII normalization rules.
- `capi/hash.test.ts` — SHA-256 hashing + already-hashed pass-through.
- `capi/user-data.test.ts` — wire-shape mapping for `user_data`.
- `capi/client.test.ts` — `FacebookCapiClient` send/retry/error paths (uses injected `fetch`).
- `server/build-event.test.ts` — payload → `ServerEvent` mapping.
- `server/extract-request.test.ts` — IP precedence, `_fbp`/`_fbc` parsing, `fbclid` fallback.
- `server/route-handler.test.ts` — App Router handler request → response.

When adding a new event field, the typical change touches four places: `shared/types.ts` (wire), `server/build-event.ts` (mapping), `client/fb-event.ts` (forward to the pixel where applicable), and `capi/types.ts` if it's a new `customData` / `userData` / `appData` member. The corresponding test files in `capi/` and `server/` should be updated.

### Conventions

- ESM-style imports always include the `.js` extension (Node ESM requirement).
- Public API surface is declared via the named entries in [tsup.config.ts](./tsup.config.ts) and the `exports` map in [package.json](./package.json) — adding a new entry requires editing both.
- The root entry must remain server-safe; do not re-export from `/client` or `/components` there.
- No runtime dependencies. Anything you reach for must be Node built-in or a peer.

## License

[MIT](./LICENSE) © 2026 [Actovision](https://github.com/actovision).

Free to use in commercial and open-source projects. The license text must be included in copies or substantial portions of the software.
