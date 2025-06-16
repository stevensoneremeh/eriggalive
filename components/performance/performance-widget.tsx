"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gauge, Zap, Clock, Monitor } from "lucide-react"
import { PerformanceMonitor } from "@/lib/performance/performance-monitor"

export function PerformanceWidget() {
  const [metrics, setMetrics] = useState<any>({})
  const [grade, setGrade] = useState<string>("--")

  useEffect(() => {
    const monitor = new PerformanceMonitor()

    const updateMetrics = () => {
      const currentMetrics = monitor.getMetrics()
      const currentGrade = monitor.getGrade()
      setMetrics(currentMetrics)
      setGrade(currentGrade)
    }

    // Initial update
    setTimeout(updateMetrics, 1000)

    // Update every 3 seconds
    const interval = setInterval(updateMetrics, 3000)

    return () => {
      clearInterval(interval)
      monitor.dispose()
    }
  }, [])

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

  const formatTime = (ms: number) => {
    if (!ms) return "--"
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Page Performance</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={`${getGradeColor(grade)} text-white text-xs`}>{grade}</Badge>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">FCP</div>
              <div className="font-medium">{formatTime(metrics.fcp)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="h-3 w-3 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">LCP</div>
              <div className="font-medium">{formatTime(metrics.lcp)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-yellow-500" />
            <div>
              <div className="text-xs text-muted-foreground">FID</div>
              <div className="font-medium">{formatTime(metrics.fid)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-3 w-3 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">CLS</div>
              <div className="font-medium">{metrics.cls ? metrics.cls.toFixed(3) : "--"}</div>
            </div>
          </div>
        </div>

        {metrics.effectiveType && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Connection</span>
              <span className="font-medium capitalize">{metrics.effectiveType}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
