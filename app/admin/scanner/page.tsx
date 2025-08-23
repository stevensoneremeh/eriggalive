"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, CheckCircle, XCircle, AlertTriangle, Clock, Scan, RefreshCw, Smartphone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface CheckinResult {
  result: "admit" | "reject"
  reason?: string
  ticket_id: string | null
  user_masked?: string
  event?: {
    title: string
    venue: string
    event_date?: string
  }
  warnings?: string[]
  previous_status?: string
  admitted_at?: string
}

interface ScanLog {
  id: string
  scan_result: "admitted" | "duplicate" | "invalid"
  scanned_at: string
  location_hint?: string
  tickets?: {
    id: string
    events: {
      title: string
      venue: string
    }
  }
}

export default function ScannerPage() {
  const [manualToken, setManualToken] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null)
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [stats, setStats] = useState({
    admitted: 0,
    duplicates: 0,
    invalid: 0,
    total: 0,
  })
  const [deviceFingerprint] = useState(() => {
    return `scanner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fetchScanLogs = async () => {
    try {
      const response = await fetch("/api/admin/scan-logs?limit=20")
      const data = await response.json()

      if (data.success) {
        setScanLogs(data.logs)

        // Calculate stats
        const admitted = data.logs.filter((log: ScanLog) => log.scan_result === "admitted").length
        const duplicates = data.logs.filter((log: ScanLog) => log.scan_result === "duplicate").length
        const invalid = data.logs.filter((log: ScanLog) => log.scan_result === "invalid").length

        setStats({
          admitted,
          duplicates,
          invalid,
          total: data.logs.length,
        })
      }
    } catch (error) {
      console.error("Failed to fetch scan logs:", error)
    }
  }

  const performCheckin = async (token: string) => {
    try {
      setIsScanning(true)

      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          device_fingerprint: deviceFingerprint,
          gate: "main_entrance",
        }),
      })

      const result: CheckinResult = await response.json()
      setLastResult(result)

      if (result.result === "admit") {
        toast({
          title: "✅ Admitted",
          description: `${result.user_masked} has been admitted`,
        })
      } else {
        toast({
          title: "❌ Rejected",
          description: result.reason || "Access denied",
          variant: "destructive",
        })
      }

      // Refresh logs and stats
      await fetchScanLogs()
    } catch (error) {
      console.error("Check-in error:", error)
      toast({
        title: "Error",
        description: "Failed to process check-in",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleManualScan = async () => {
    if (!manualToken.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a QR token",
        variant: "destructive",
      })
      return
    }

    await performCheckin(manualToken)
    setManualToken("")
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "admitted":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "duplicate":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Scan className="h-5 w-5 text-gray-500" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "admitted":
        return "bg-green-100 text-green-800 border-green-200"
      case "duplicate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "invalid":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  useEffect(() => {
    fetchScanLogs()
    // Refresh every 30 seconds
    const interval = setInterval(fetchScanLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Venue Scanner</h1>
          <p className="text-gray-600 dark:text-gray-400">Check-in attendees at the venue gate</p>
        </div>
        <Button variant="outline" onClick={fetchScanLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admitted</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duplicates</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.duplicates}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Invalid</p>
                <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Scan className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scan Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          {/* Scanner Interface */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Manual Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Manual Token Entry
                </CardTitle>
                <CardDescription>Enter QR token manually for check-in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter QR token..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                    className="font-mono"
                  />
                  <Button onClick={handleManualScan} disabled={isScanning || !manualToken.trim()}>
                    {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Paste or type the QR token from the ticket and press Enter or click Scan
                </p>
              </CardContent>
            </Card>

            {/* Last Result */}
            <Card>
              <CardHeader>
                <CardTitle>Last Scan Result</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {lastResult ? (
                    <motion.div
                      key={lastResult.ticket_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div
                        className={`p-4 rounded-lg border ${
                          lastResult.result === "admit" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {lastResult.result === "admit" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              lastResult.result === "admit" ? "text-green-800" : "text-red-800"
                            }`}
                          >
                            {lastResult.result === "admit" ? "ADMITTED" : "REJECTED"}
                          </span>
                        </div>

                        {lastResult.user_masked && (
                          <p className="text-sm text-gray-700 mb-1">{lastResult.user_masked}</p>
                        )}

                        {lastResult.event && (
                          <p className="text-sm text-gray-600">
                            {lastResult.event.title} • {lastResult.event.venue}
                          </p>
                        )}

                        {lastResult.reason && <p className="text-sm text-red-600 mt-2">Reason: {lastResult.reason}</p>}

                        {lastResult.warnings && lastResult.warnings.length > 0 && (
                          <div className="mt-2">
                            {lastResult.warnings.map((warning, index) => (
                              <p key={index} className="text-sm text-yellow-600">
                                ⚠️ {warning}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-500"
                    >
                      <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No scans yet</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Scan Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scan Activity</CardTitle>
              <CardDescription>Real-time log of all scan attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanLogs.length > 0 ? (
                  scanLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getResultIcon(log.scan_result)}
                        <div>
                          <p className="font-medium">
                            {log.tickets?.events.title || "Unknown Event"} •{" "}
                            {log.tickets?.events.venue || "Unknown Venue"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.scanned_at).toLocaleString()}
                            {log.location_hint && ` • ${log.location_hint}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getResultColor(log.scan_result)}>{log.scan_result}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No scan logs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
