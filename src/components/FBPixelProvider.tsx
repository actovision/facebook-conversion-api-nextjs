'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'
import { fbPageView } from '../client/fb-page-view.js'

export interface FBPixelProviderProps {
  children?: ReactNode
  /** Fire PageView on navigation. Default true. */
  trackPageViews?: boolean
}

/**
 * App Router pixel provider — fires PageView on client-side navigation
 * (pathname or searchParams change). Safe to wrap your root layout.
 *
 * For Pages Router, use `FBPixelProviderPages` instead.
 */
export function FBPixelProvider({ children, trackPageViews = true }: FBPixelProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (!trackPageViews) return
    // Skip the initial render — FBPixelScript already fires the first PageView
    // as part of its init snippet.
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    fbPageView()
  }, [pathname, searchParams, trackPageViews])

  return <>{children}</>
}
