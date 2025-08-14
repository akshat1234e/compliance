'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Analytics configuration
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
const ENABLE_ANALYTICS = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

// Initialize Google Analytics
export function initGA() {
  if (!GA_TRACKING_ID || !ENABLE_ANALYTICS) return

  // Load Google Analytics script
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
  script.async = true
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  // Configure Google Analytics
  window.gtag('js', new Date())
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  })
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!GA_TRACKING_ID || !ENABLE_ANALYTICS || typeof window.gtag !== 'function') return

  window.gtag('config', GA_TRACKING_ID, {
    page_title: title || document.title,
    page_location: url,
    anonymize_ip: true
  })
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (!GA_TRACKING_ID || !ENABLE_ANALYTICS || typeof window.gtag !== 'function') return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    anonymize_ip: true
  })
}

// Track user interactions
export function trackUserInteraction(action: string, element: string, details?: any) {
  if (!ENABLE_ANALYTICS) return

  trackEvent(action, 'user_interaction', element)
  
  // Also track to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics:', { action, element, details })
  }
}

// Track compliance events
export function trackComplianceEvent(action: string, workflowType?: string, details?: any) {
  if (!ENABLE_ANALYTICS) return

  trackEvent(action, 'compliance', workflowType)
  
  // Track compliance-specific metrics
  if (typeof window !== 'undefined') {
    const complianceData = {
      action,
      workflowType,
      timestamp: new Date().toISOString(),
      ...details
    }
    
    // Store in localStorage for analytics dashboard
    const existingData = JSON.parse(localStorage.getItem('compliance_analytics') || '[]')
    existingData.push(complianceData)
    
    // Keep only last 100 events
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    
    localStorage.setItem('compliance_analytics', JSON.stringify(existingData))
  }
}

// Track performance metrics
export function trackPerformance(metric: string, value: number, category = 'performance') {
  if (!ENABLE_ANALYTICS) return

  trackEvent(metric, category, undefined, value)
  
  // Track to Performance API if available
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.mark(`${category}_${metric}`)
    } catch (error) {
      console.warn('Performance tracking error:', error)
    }
  }
}

// Track errors
export function trackError(error: Error, context?: string) {
  if (!ENABLE_ANALYTICS) return

  trackEvent('error', 'javascript', `${context || 'unknown'}: ${error.message}`)
  
  // In development, also log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Tracked Error:', error, context)
  }
}

// Main Analytics component
export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize analytics on mount
    if (ENABLE_ANALYTICS) {
      initGA()
    }
  }, [])

  useEffect(() => {
    // Track page views on route changes
    if (ENABLE_ANALYTICS && pathname) {
      trackPageView(window.location.href, document.title)
    }
  }, [pathname])

  useEffect(() => {
    // Track performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart)
            trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart)
          }
          
          if (entry.entryType === 'paint') {
            trackPerformance(entry.name.replace('-', '_'), entry.startTime)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'paint'] })
      } catch (error) {
        console.warn('Performance observer error:', error)
      }

      return () => observer.disconnect()
    }
  }, [])

  // Track unhandled errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), `${event.filename}:${event.lineno}`)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(String(event.reason)), 'unhandled_promise_rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // This component doesn't render anything
}

// Hook for analytics in components
export function useAnalytics() {
  return {
    trackEvent,
    trackUserInteraction,
    trackComplianceEvent,
    trackPerformance,
    trackError,
    trackPageView
  }
}

// Higher-order component for tracking component usage
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function AnalyticsWrapper(props: P) {
    useEffect(() => {
      trackUserInteraction('component_mount', componentName)
    }, [])

    return <WrappedComponent {...props} />
  }
}

// Analytics context for advanced usage
import { createContext, useContext } from 'react'

interface AnalyticsContextType {
  trackEvent: typeof trackEvent
  trackUserInteraction: typeof trackUserInteraction
  trackComplianceEvent: typeof trackComplianceEvent
  trackPerformance: typeof trackPerformance
  trackError: typeof trackError
  isEnabled: boolean
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  trackUserInteraction: () => {},
  trackComplianceEvent: () => {},
  trackPerformance: () => {},
  trackError: () => {},
  isEnabled: false
})

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const value: AnalyticsContextType = {
    trackEvent,
    trackUserInteraction,
    trackComplianceEvent,
    trackPerformance,
    trackError,
    isEnabled: ENABLE_ANALYTICS
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  return useContext(AnalyticsContext)
}
