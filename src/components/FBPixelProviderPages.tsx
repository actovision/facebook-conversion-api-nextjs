'use client'

import { useRouter } from 'next/router'
import { useEffect, type ReactNode } from 'react'
import { fbPageView } from '../client/fb-page-view.js'

export interface FBPixelProviderPagesProps {
  children?: ReactNode
  trackPageViews?: boolean
}

/** Pages Router pixel provider — fires PageView on `routeChangeComplete`. */
export function FBPixelProviderPages({
  children,
  trackPageViews = true,
}: FBPixelProviderPagesProps) {
  const router = useRouter()

  useEffect(() => {
    if (!trackPageViews) return
    const handle = () => fbPageView()
    router.events.on('routeChangeComplete', handle)
    return () => router.events.off('routeChangeComplete', handle)
  }, [router.events, trackPageViews])

  return <>{children}</>
}
