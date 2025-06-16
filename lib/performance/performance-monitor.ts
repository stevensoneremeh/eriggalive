export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte

  // Custom Metrics
  domContentLoaded: number
  loadComplete: number
  firstInteraction: number
  authLoadTime: number
  navigationLoadTime: number

  // Resource Metrics
  totalResources: number
  totalSize: number
  imageLoadTime: number
  jsLoadTime: number
  cssLoadTime: number

  // Network Metrics
  connectionType: string
  effectiveType: string
  rtt: number
  downlink: number
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private startTime = performance.now()

  constructor() {
    this.initializeObservers()
    this.measureBasicMetrics()
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        this.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ["first-input"] })
      this.observers.push(fidObserver)

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })
      this.observers.push(clsObserver)

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.ttfb = entry.responseStart - entry.requestStart
          this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
          this.metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart
        })
      })
      navigationObserver.observe({ entryTypes: ["navigation"] })
      this.observers.push(navigationObserver)

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        this.analyzeResourceTiming(entries)
      })
      resourceObserver.observe({ entryTypes: ["resource"] })
      this.observers.push(resourceObserver)
    }
  }

  private measureBasicMetrics() {
    // First Contentful Paint
    const paintEntries = performance.getEntriesByType("paint")
    const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime
    }

    // Network Information
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      this.metrics.connectionType = connection.type || "unknown"
      this.metrics.effectiveType = connection.effectiveType || "unknown"
      this.metrics.rtt = connection.rtt || 0
      this.metrics.downlink = connection.downlink || 0
    }
  }

  private analyzeResourceTiming(entries: PerformanceEntry[]) {
    let totalSize = 0
    let imageLoadTime = 0
    let jsLoadTime = 0
    let cssLoadTime = 0
    let imageCount = 0
    let jsCount = 0
    let cssCount = 0

    entries.forEach((entry: any) => {
      const duration = entry.responseEnd - entry.requestStart
      const size = entry.transferSize || 0
      totalSize += size

      if (entry.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        imageLoadTime += duration
        imageCount++
      } else if (entry.name.match(/\.js$/i)) {
        jsLoadTime += duration
        jsCount++
      } else if (entry.name.match(/\.css$/i)) {
        cssLoadTime += duration
        cssCount++
      }
    })

    this.metrics.totalResources = entries.length
    this.metrics.totalSize = totalSize
    this.metrics.imageLoadTime = imageCount > 0 ? imageLoadTime / imageCount : 0
    this.metrics.jsLoadTime = jsCount > 0 ? jsLoadTime / jsCount : 0
    this.metrics.cssLoadTime = cssCount > 0 ? cssLoadTime / cssCount : 0
  }

  public measureAuthLoadTime(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const checkAuth = () => {
        // Check if auth context is ready
        const authElement = document.querySelector("[data-auth-ready]")
        if (authElement) {
          const loadTime = performance.now() - startTime
          this.metrics.authLoadTime = loadTime
          resolve(loadTime)
        } else {
          setTimeout(checkAuth, 10)
        }
      }
      checkAuth()
    })
  }

  public measureNavigationLoadTime(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const checkNavigation = () => {
        // Check if navigation is ready
        const navElement = document.querySelector("header nav")
        if (navElement) {
          const loadTime = performance.now() - startTime
          this.metrics.navigationLoadTime = loadTime
          resolve(loadTime)
        } else {
          setTimeout(checkNavigation, 10)
        }
      }
      checkNavigation()
    })
  }

  public measureFirstInteraction(): void {
    const startTime = performance.now()
    const handleFirstInteraction = () => {
      this.metrics.firstInteraction = performance.now() - startTime
      document.removeEventListener("click", handleFirstInteraction)
      document.removeEventListener("keydown", handleFirstInteraction)
      document.removeEventListener("touchstart", handleFirstInteraction)
    }

    document.addEventListener("click", handleFirstInteraction, { once: true })
    document.addEventListener("keydown", handleFirstInteraction, { once: true })
    document.addEventListener("touchstart", handleFirstInteraction, { once: true })
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics
  }

  public getGrade(): "A" | "B" | "C" | "D" | "F" {
    const { fcp = 0, lcp = 0, fid = 0, cls = 0 } = this.metrics

    let score = 100

    // FCP scoring (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
    if (fcp > 3000) score -= 30
    else if (fcp > 1800) score -= 15

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (lcp > 4000) score -= 30
    else if (lcp > 2500) score -= 15

    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (fid > 300) score -= 25
    else if (fid > 100) score -= 10

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (cls > 0.25) score -= 15
    else if (cls > 0.1) score -= 8

    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  public dispose() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}
