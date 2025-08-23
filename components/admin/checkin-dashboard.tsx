"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Users, Clock, RefreshCw } from "lucide-react"

interface CheckinStats {
  total_tickets: number
  admitted: number
  remaining: number
  duplicate_attempts: number
  invalid_attempts: number
  recent_activity: Array<{
    id: string
    scan_result: string
    scanned_at: string
    event_title: string
  }>
}

export function CheckinDashboard() {
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      // This would be implemented as an API endpoint
      const mockStats: CheckinStats = {
        total_tickets: 150,
        admitted: 89,
        remaining: 61,
        duplicate_attempts: 3,
        invalid_attempts: 7,
        recent_activity: [
          {
            id: "1",
            scan_result: "admitted",
            scanned_at: new Date().toISOString(),
            event_title: "Erigga Live Concert",
          },
          {
            id: "2",
            scan_result: "duplicate",
            scanned_at: new Date(Date.now() - 300000).toISOString(),
            event_title: "Erigga Live Concert",
          },
        ],
      }
      setStats(mockStats)
    } catch (error) {
      console.error("Failed to fetch check-in stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "admitted":
        return "bg-green-100 text-green-800"
      case "duplicate":
        return "bg-yellow-100 text-yellow-800"
      case "invalid":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "admitted":
        return <CheckCircle className="h-4 w-4" />
      case "duplicate":
        return <AlertTriangle className="h-4 w-4" />
      case "invalid":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total_tickets}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admitted</p>
                <p className="text-2xl font-bold text-green-600">{stats.admitted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{stats.remaining}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.duplicate_attempts + stats.invalid_attempts}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Check-in Activity</CardTitle>
              <CardDescription>Live updates from venue scanners</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recent_activity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getResultIcon(activity.scan_result)}
                  <div>
                    <p className="font-medium">{activity.event_title}</p>
                    <p className="text-sm text-gray-500">{new Date(activity.scanned_at).toLocaleString()}</p>
                  </div>
                </div>
                <Badge className={getResultColor(activity.scan_result)}>{activity.scan_result}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
