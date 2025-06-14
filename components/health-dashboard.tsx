"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity, Server, Database, CreditCard } from "lucide-react"

interface HealthCheck {
  status: "pass" | "fail" | "warn"
  responseTime: number
  message?: string
  details?: any
}

interface HealthData {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheck
    paystack: HealthCheck
    storage: HealthCheck
    auth: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
  }
  metadata: {
    nodeVersion: string
    platform: string
    totalMemory: number
    freeMemory: number
    cpuUsage: number
  }
}

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warn":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "fail":
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant =
      status === "pass" || status === "healthy"
        ? "default"
        : status === "warn" || status === "degraded"
          ? "secondary"
          : "destructive"
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading health status...</span>
      </div>
    )
  }

  if (!healthData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Failed to load health data</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">System Health</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchHealthData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {getStatusIcon(healthData.status)}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold capitalize">{healthData.status}</span>
                {getStatusBadge(healthData.status)}
              </div>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated?.toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(healthData.uptime)}</div>
            <p className="text-xs text-muted-foreground">Since last restart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{healthData.environment}</div>
            <p className="text-xs text-muted-foreground">Version {healthData.version}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.metadata.totalMemory - healthData.metadata.freeMemory}MB
            </div>
            <p className="text-xs text-muted-foreground">of {healthData.metadata.totalMemory}MB total</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(healthData.checks).map(([service, check]) => (
          <Card key={service}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {service === "paystack" ? "Paystack API" : service}
              </CardTitle>
              {service === "database" && <Database className="h-4 w-4 text-muted-foreground" />}
              {service === "paystack" && <CreditCard className="h-4 w-4 text-muted-foreground" />}
              {service !== "database" && service !== "paystack" && (
                <Activity className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(check.status)}
                  {getStatusBadge(check.status)}
                </div>
                <div className="text-sm text-muted-foreground">{check.responseTime}ms</div>
              </div>
              {check.message && <p className="text-xs text-muted-foreground mt-2">{check.message}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Detailed system and runtime information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Node.js:</span>
              <div className="text-muted-foreground">{healthData.metadata.nodeVersion}</div>
            </div>
            <div>
              <span className="font-medium">Platform:</span>
              <div className="text-muted-foreground">{healthData.metadata.platform}</div>
            </div>
            <div>
              <span className="font-medium">CPU Usage:</span>
              <div className="text-muted-foreground">{healthData.metadata.cpuUsage.toFixed(2)}s</div>
            </div>
            <div>
              <span className="font-medium">Timestamp:</span>
              <div className="text-muted-foreground">{new Date(healthData.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
