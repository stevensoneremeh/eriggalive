import { PerformanceMonitor } from "./performance-monitor"

export interface PagePerformanceTest {
  url: string
  name: string
  expectedLoadTime: number
  criticalResources: string[]
  requiredElements: string[]
}

export interface PerformanceTestResult {
  page: string
  passed: boolean
  metrics: any
  grade: string
  issues: string[]
  recommendations: string[]
  timestamp: number
}

export class PerformanceTestSuite {
  private results: PerformanceTestResult[] = []

  private testPages: PagePerformanceTest[] = [
    {
      url: "/",
      name: "Home Page",
      expectedLoadTime: 2000,
      criticalResources: ["/images/hero/", "/_next/static/"],
      requiredElements: ["header", "nav", "main"],
    },
    {
      url: "/login",
      name: "Login Page",
      expectedLoadTime: 1500,
      criticalResources: ["/_next/static/"],
      requiredElements: ["form", 'input[type="email"]', 'button[type="submit"]'],
    },
    {
      url: "/community",
      name: "Community Page",
      expectedLoadTime: 2500,
      criticalResources: ["/api/posts", "/_next/static/"],
      requiredElements: ['[data-testid="post-list"]', 'button[data-testid="create-post"]'],
    },
    {
      url: "/dashboard",
      name: "Dashboard",
      expectedLoadTime: 2000,
      criticalResources: ["/api/user/profile", "/_next/static/"],
      requiredElements: ["aside", '[data-testid="coin-balance"]', '[data-testid="tier-badge"]'],
    },
    {
      url: "/vault",
      name: "Media Vault",
      expectedLoadTime: 3000,
      criticalResources: ["/api/media", "/_next/static/"],
      requiredElements: ['[data-testid="media-grid"]', "video", "audio"],
    },
  ]

  public async runAllTests(): Promise<PerformanceTestResult[]> {
    console.log("🚀 Starting Performance Test Suite...")
    this.results = []

    for (const page of this.testPages) {
      console.log(`📊 Testing ${page.name}...`)
      const result = await this.testPage(page)
      this.results.push(result)

      // Wait between tests to avoid overwhelming the system
      await this.wait(1000)
    }

    this.generateReport()
    return this.results
  }

  private async testPage(page: PagePerformanceTest): Promise<PerformanceTestResult> {
    const monitor = new PerformanceMonitor()
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Navigate to page if not already there
      if (window.location.pathname !== page.url) {
        const navigationStart = performance.now()
        window.history.pushState({}, "", page.url)

        // Simulate page load
        await this.wait(100)

        const navigationTime = performance.now() - navigationStart
        if (navigationTime > 500) {
          issues.push("Slow navigation between pages")
          recommendations.push("Implement page prefetching for faster navigation")
        }
      }

      // Wait for page to stabilize
      await this.wait(2000)

      // Measure auth and navigation load times
      const authLoadTime = await monitor.measureAuthLoadTime().catch(() => 0)
      const navLoadTime = await monitor.measureNavigationLoadTime().catch(() => 0)

      // Check for required elements
      for (const selector of page.requiredElements) {
        const element = document.querySelector(selector)
        if (!element) {
          issues.push(`Missing required element: ${selector}`)
        } else if (!this.isElementVisible(element)) {
          issues.push(`Required element not visible: ${selector}`)
        }
      }

      // Get final metrics
      const metrics = monitor.getMetrics()
      const grade = monitor.getGrade()

      // Analyze metrics and generate recommendations
      this.analyzeMetrics(metrics, issues, recommendations, page)

      const passed = issues.length === 0 && grade !== "F"

      monitor.dispose()

      return {
        page: page.name,
        passed,
        metrics: {
          ...metrics,
          authLoadTime,
          navLoadTime,
        },
        grade,
        issues,
        recommendations,
        timestamp: Date.now(),
      }
    } catch (error) {
      monitor.dispose()
      return {
        page: page.name,
        passed: false,
        metrics: {},
        grade: "F",
        issues: [`Test failed: ${error}`],
        recommendations: ["Fix critical errors before performance optimization"],
        timestamp: Date.now(),
      }
    }
  }

  private analyzeMetrics(metrics: any, issues: string[], recommendations: string[], page: PagePerformanceTest) {
    // Analyze Core Web Vitals
    if (metrics.fcp > 1800) {
      issues.push(`Slow First Contentful Paint: ${Math.round(metrics.fcp)}ms`)
      recommendations.push("Optimize critical rendering path and reduce blocking resources")
    }

    if (metrics.lcp > 2500) {
      issues.push(`Slow Largest Contentful Paint: ${Math.round(metrics.lcp)}ms`)
      recommendations.push("Optimize largest page element (images, videos, text blocks)")
    }

    if (metrics.fid > 100) {
      issues.push(`High First Input Delay: ${Math.round(metrics.fid)}ms`)
      recommendations.push("Reduce JavaScript execution time and main thread blocking")
    }

    if (metrics.cls > 0.1) {
      issues.push(`High Cumulative Layout Shift: ${metrics.cls.toFixed(3)}`)
      recommendations.push("Reserve space for dynamic content and avoid layout shifts")
    }

    // Analyze load times
    if (metrics.authLoadTime > 1000) {
      issues.push(`Slow authentication loading: ${Math.round(metrics.authLoadTime)}ms`)
      recommendations.push("Optimize authentication state management and reduce API calls")
    }

    if (metrics.navLoadTime > 500) {
      issues.push(`Slow navigation loading: ${Math.round(metrics.navLoadTime)}ms`)
      recommendations.push("Optimize navigation component and reduce heavy computations")
    }

    // Analyze resource loading
    if (metrics.totalSize > 2 * 1024 * 1024) {
      // 2MB
      issues.push(`Large total page size: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`)
      recommendations.push("Optimize and compress resources, implement lazy loading")
    }

    if (metrics.imageLoadTime > 1000) {
      issues.push(`Slow image loading: ${Math.round(metrics.imageLoadTime)}ms`)
      recommendations.push("Implement image optimization, WebP format, and lazy loading")
    }

    // Network analysis
    if (metrics.effectiveType === "2g" || metrics.effectiveType === "slow-2g") {
      recommendations.push("Consider offline-first approach for slow connections")
    }

    if (metrics.rtt > 300) {
      recommendations.push("Implement service worker for better caching on high-latency connections")
    }
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      style.opacity !== "0"
    )
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private generateReport() {
    console.log("\n📊 PERFORMANCE TEST RESULTS")
    console.log("=".repeat(50))

    let totalPassed = 0
    let totalGradePoints = 0

    this.results.forEach((result, index) => {
      const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }[result.grade] || 0
      totalGradePoints += gradePoints

      if (result.passed) totalPassed++

      console.log(`\n${index + 1}. ${result.page}`)
      console.log(`   Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`)
      console.log(`   Grade: ${result.grade}`)

      if (result.metrics.fcp) {
        console.log(`   FCP: ${Math.round(result.metrics.fcp)}ms`)
      }
      if (result.metrics.lcp) {
        console.log(`   LCP: ${Math.round(result.metrics.lcp)}ms`)
      }
      if (result.metrics.fid) {
        console.log(`   FID: ${Math.round(result.metrics.fid)}ms`)
      }
      if (result.metrics.cls) {
        console.log(`   CLS: ${result.metrics.cls.toFixed(3)}`)
      }

      if (result.issues.length > 0) {
        console.log("   Issues:")
        result.issues.forEach((issue) => console.log(`     • ${issue}`))
      }

      if (result.recommendations.length > 0) {
        console.log("   Recommendations:")
        result.recommendations.forEach((rec) => console.log(`     → ${rec}`))
      }
    })

    const averageGrade = totalGradePoints / this.results.length
    const passRate = (totalPassed / this.results.length) * 100

    console.log("\n" + "=".repeat(50))
    console.log("SUMMARY")
    console.log(`Pass Rate: ${passRate.toFixed(1)}% (${totalPassed}/${this.results.length})`)
    console.log(`Average Grade: ${averageGrade.toFixed(1)} (${this.getLetterGrade(averageGrade)})`)

    if (passRate === 100 && averageGrade >= 3.5) {
      console.log("🎉 EXCELLENT! All tests passed with high performance grades.")
    } else if (passRate >= 80) {
      console.log("✅ GOOD! Most tests passed. Address remaining issues for optimal performance.")
    } else {
      console.log("⚠️  NEEDS IMPROVEMENT! Several performance issues need attention.")
    }
  }

  private getLetterGrade(points: number): string {
    if (points >= 3.7) return "A"
    if (points >= 3.0) return "B"
    if (points >= 2.0) return "C"
    if (points >= 1.0) return "D"
    return "F"
  }

  public getResults(): PerformanceTestResult[] {
    return this.results
  }
}
