'use client'

/** Fire a browser-side Meta Pixel PageView. Server-side PageView is usually
 *  undesirable since it double-counts against the pixel; if you need it,
 *  call `fbEvent({ eventName: 'PageView', enableStandardPixel: false })`. */
export function fbPageView(): void {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  window.fbq('track', 'PageView')
}
