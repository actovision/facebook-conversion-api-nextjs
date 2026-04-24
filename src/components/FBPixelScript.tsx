'use client'

import Script from 'next/script'

export interface FBPixelScriptProps {
  pixelId: string
  /** CSP nonce to allow the inline init script under strict CSP. */
  nonce?: string
  /** next/script strategy. Default `'afterInteractive'`. */
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive'
}

/** Mount once in your root layout (App Router) or `_app` (Pages Router). */
export function FBPixelScript({
  pixelId,
  nonce,
  strategy = 'afterInteractive',
}: FBPixelScriptProps) {
  return (
    <Script
      id="fb-pixel-init"
      strategy={strategy}
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`,
      }}
    />
  )
}
