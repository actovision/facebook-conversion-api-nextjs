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
| `signalsFromRequest`, `signalsFromNodeRequest` | Pull IP, UA, `_fbp`, `_fbc` from a request. |
| `buildServerEvent` | Build a `ServerEvent` from a flat payload — useful if you write your own handler. |

Both factory handlers accept every `FacebookCapiClientOptions` plus:
- `actionSource` — default for `action_source` (default `'website'`)
- `apiVersion` — Graph API version (default `'v22.0'`)
- `testEventCode` — Meta Test Events tab code; removed in production
- `timeoutMs` / `retries` — network tuning (defaults 10 s / 2 retries on 5xx)
- `transformEvent` — last-chance mutator before sending
- `debug` — echo the payload + Meta response in the HTTP response body

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
| `<FBPixelScript pixelId nonce? strategy? />` | Inline Meta Pixel init via `next/script`. |
| `<FBPixelProvider>` | **App Router** — fires PageView on pathname/searchParams change. |
| `<FBPixelProviderPages>` | **Pages Router** — fires PageView on `routeChangeComplete`. |

## License

[MIT](./LICENSE) © 2026 [Actovision](https://github.com/actovision).

Free to use in commercial and open-source projects. The license text must be included in copies or substantial portions of the software.
