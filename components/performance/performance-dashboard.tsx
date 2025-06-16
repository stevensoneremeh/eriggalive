"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Zap,
  Clock,
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Monitor,
  Wifi,
} from "lucide-react"
import { PerformanceTestSuite, type PerformanceTestResult } from "@/lib/performance/performance-test-suite"
import { PerformanceMonitor } from "@/lib/performance/performance-monitor"

export default function PerformanceDashboard() {
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any>({})
  const [isRunning, setIsRunning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // Initialize real-time monitoring
    const monitor = new PerformanceMonitor()

    const updateMetrics = () => {
      setCurrentMetrics(monitor.getMetrics())
    }

    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000)

    // Initial update
    updateMetrics()

    return () => {
      clearInterval(interval)
      monitor.dispose()
    }
  }, [])

  const runPerformanceTests = async () => {
    setIsRunning(true)
    try {
      const testSuite = new PerformanceTestSuite()
      const results = await testSuite.runAllTests()
      setTestResults(results)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Performance tests failed:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500"
      case "B":
        return "bg-blue-500"
      case "C":
        return "bg-yellow-500"
      case "D":
        return "bg-orange-500"
      case "F":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getOverallGrade = () => {
    if (testResults.length === 0) return "N/A"

    const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }
    const total = testResults.reduce(
      (sum, result) => sum + (gradePoints[result.grade as keyof typeof gradePoints] || 0),
      0,
    )
    const average = total / testResults.length

    if (average >= 3.7) return "A"
    if (average >= 3.0) return "B"
    if (average >= 2.0) return "C"
    if (average >= 1.0) return "D"
    return "F"
  }

  const getPassRate = () => {
    if (testResults.length === 0) return 0
    return (testResults.filter((r) => r.passed).length / testResults.length) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and analyze website performance metrics</p>
        </div>
        <Button
          onClick={runPerformanceTests}
          disabled={isRunning}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
          {isRunning ? "Running Tests..." : "Run Performance Tests"}
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.fcp ? formatTime(currentMetrics.fcp) : "--"}</div>
            <p className="text-xs text-muted-foreground">Good: &lt;1.8s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.lcp ? formatTime(currentMetrics.lcp) : "--"}</div>
            <p className="text-xs text-muted-foreground">Good: &lt;2.5s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Input Delay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.fid ? formatTime(currentMetrics.fid) : "--"}</div>
            <p className="text-xs text-muted-foreground">Good: &lt;100ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumulative Layout Shift</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.cls ? currentMetrics.cls.toFixed(3) : "--"}</div>
            <p className="text-xs text-muted-foreground">Good: &lt;0.1</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Type</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">{currentMetrics.effectiveType || "Unknown"}</div>
            <p className="text-xs text-muted-foreground">RTT: {currentMetrics.rtt || 0}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Download Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {currentMetrics.downlink ? `${currentMetrics.downlink} Mbps` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Estimated bandwidth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{currentMetrics.totalResources || 0}</div>
            <p className="text-xs text-muted-foreground">
              Size: {currentMetrics.totalSize ? `${(currentMetrics.totalSize / 1024 / 1024).toFixed(2)}MB` : "--"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
              <Badge className={`${getGradeColor(getOverallGrade())} text-white`}>{getOverallGrade()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getOverallGrade()}</div>
              <p className="text-xs text-muted-foreground">Based on {testResults.length} page tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPassRate().toFixed(1)}%</div>
              <Progress value={getPassRate()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}</div>
              <p className="text-xs text-muted-foreground">{lastUpdated ? lastUpdated.toLocaleDateString() : ""}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Page Performance Results</CardTitle>
            <CardDescription>Detailed performance analysis for each page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.passed)}
                      <h3 className="font-semibold">{result.page}</h3>
                      <Badge className={`${getGradeColor(result.grade)} text-white`}>{result.grade}</Badge>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {result.metrics.fcp && (
                      <div>
                        <div className="text-sm text-muted-foreground">FCP</div>
                        <div className="font-medium">{formatTime(result.metrics.fcp)}</div>
                      </div>
                    )}
                    {result.metrics.lcp && (
                      <div>
                        <div className="text-sm text-muted-foreground">LCP</div>
                        <div className="font-medium">{formatTime(result.metrics.lcp)}</div>
                      </div>
                    )}
                    {result.metrics.fid && (
                      <div>
                        <div className="text-sm text-muted-foreground">FID</div>
                        <div className="font-medium">{formatTime(result.metrics.fid)}</div>
                      </div>
                    )}
                    {result.metrics.cls && (
                      <div>
                        <div className="text-sm text-muted-foreground">CLS</div>
                        <div className="font-medium">{result.metrics.cls.toFixed(3)}</div>
                      </div>
                    )}
                  </div>

                  {/* Issues */}
                  {result.issues.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Issues Found</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Recommendations</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {testResults.length === 0 && !isRunning && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gauge className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Performance Data</h3>
            <p className="text-muted-foreground text-center mb-6">
              Run the performance test suite to analyze your website's loading speeds and responsiveness.
            </p>
            <Button onClick={runPerformanceTests} className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Zap className="h-4 w-4 mr-2" />
              Start Performance Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
