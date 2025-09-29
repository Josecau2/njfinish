import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'

// Performance monitoring for PHASE HADES (Performance Underworld)
// Focus: LCP < 2.5s target for mobile key screens

class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.isMobile = this.detectMobile()
    this.keyScreens = [
      '/dashboard',
      '/proposals',
      '/orders',
      '/my-orders',
      '/customers',
      '/payments'
    ]
  }

  detectMobile() {
    return window.innerWidth <= 768 ||
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  isKeyScreen(pathname) {
    return this.keyScreens.some(screen => pathname.includes(screen))
  }

  init() {
    // Only monitor on mobile for key screens
    if (!this.isMobile) return

    const currentPath = window.location.pathname
    if (!this.isKeyScreen(currentPath)) return

    // Monitor Largest Contentful Paint (LCP) - target < 2.5s
    onLCP((metric) => {
      this.metrics.lcp = metric.value
      this.reportMetric('LCP', metric.value, 2500, currentPath)

      // Alert if LCP exceeds target
      if (metric.value > 2500) {
        console.warn(`🚨 PHASE HADES: LCP violation on ${currentPath} - ${metric.value}ms (target: <2500ms)`)
        this.sendAlert('LCP_VIOLATION', {
          path: currentPath,
          value: metric.value,
          target: 2500,
          userAgent: navigator.userAgent
        })
      }
    })

    // Monitor Cumulative Layout Shift (CLS) - target < 0.1
    onCLS((metric) => {
      this.metrics.cls = metric.value
      this.reportMetric('CLS', metric.value, 0.1, currentPath)

      if (metric.value > 0.1) {
        console.warn(`🚨 PHASE HADES: CLS violation on ${currentPath} - ${metric.value} (target: <0.1)`)
        this.sendAlert('CLS_VIOLATION', {
          path: currentPath,
          value: metric.value,
          target: 0.1,
          userAgent: navigator.userAgent
        })
      }
    })

    // Monitor Interaction to Next Paint (INP) - target < 200ms
    onINP((metric) => {
      this.metrics.inp = metric.value
      this.reportMetric('INP', metric.value, 200, currentPath)

      if (metric.value > 200) {
        console.warn(`🚨 PHASE HADES: INP violation on ${currentPath} - ${metric.value}ms (target: <200ms)`)
      }
    })

    // Monitor First Contentful Paint (FCP) - target < 1800ms
    onFCP((metric) => {
      this.metrics.fcp = metric.value
      this.reportMetric('FCP', metric.value, 1800, currentPath)
    })

    // Monitor Time to First Byte (TTFB) - target < 800ms
    onTTFB((metric) => {
      this.metrics.ttfb = metric.value
      this.reportMetric('TTFB', metric.value, 800, currentPath)
    })
  }

  reportMetric(name, value, target, path) {
    const status = value <= target ? '✅' : '❌'
    console.log(`${status} PHASE HADES: ${name} on ${path} - ${value}${name === 'CLS' ? '' : 'ms'} (target: ${target}${name === 'CLS' ? '' : 'ms'})`)
  }

  sendAlert(type, data) {
    // In production, send to monitoring service
    // For now, just log to console with structured data
    const alertData = {
      type,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...data
    }

    // Store in localStorage for debugging (in production, send to service)
    const alerts = JSON.parse(localStorage.getItem('performance_alerts') || '[]')
    alerts.push(alertData)
    localStorage.setItem('performance_alerts', JSON.stringify(alerts.slice(-10))) // Keep last 10

    // Could integrate with services like:
    // - Sentry
    // - DataDog
    // - Google Analytics
    // - Custom monitoring endpoint
  }

  getMetrics() {
    return { ...this.metrics }
  }

  // Utility to check if current screen meets performance targets
  checkPerformanceTargets() {
    const { lcp, cls } = this.metrics
    return {
      lcp: lcp ? lcp <= 2500 : null,
      cls: cls ? cls <= 0.1 : null,
      overall: (lcp <= 2500 && cls <= 0.1) || null
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor