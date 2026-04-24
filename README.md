# @actovision/facebook-conversion-api-nextjs

Next.js integration for [Meta's Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/). Supports **App Router** and **Pages Router**. Fully self-contained — talks to the Meta Graph API directly, no companion package required.

- Server-side CAPI handler (App Router **and** Pages Router)
- Browser helper `fbEvent()` that fires the pixel + the server event with matching `eventId` for automatic deduplication
- Meta Pixel `<Script>` loader and a pageview provider for each router
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

Both factory handlers accept every `CapiClientOptions` (see the nodejs package README) plus:
- `actionSource` — default for `action_source` (default `'website'`)
- `transformEvent` — last-chance mutator before sending
- `debug` — echo the payload + Meta response in the HTTP response body

### Components

| Symbol | Description |
| --- | --- |
| `<FBPixelScript pixelId nonce? strategy? />` | Inline Meta Pixel init via `next/script`. |
| `<FBPixelProvider>` | **App Router** — fires PageView on pathname/searchParams change. |
| `<FBPixelProviderPages>` | **Pages Router** — fires PageView on `routeChangeComplete`. |

## License

MIT
