"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  CameraOff,
  Scan,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Clock,
  Smartphone,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface ScanResult {
  success: boolean
  message: string
  ticket?: {
    id: string
    event_title: string
    holder_name: string
    status: string
  }
  timestamp: Date
}

interface ScanLog {
  id: string
  ticket_id: string
  event_title: string
  holder_name: string
  status: "admitted" | "invalid" | "already_used"
  scanned_at: string
  scanner_name: string
}

export default function AdminCheckinPage() {
  const { user, profile } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [manualEntry, setManualEntry] = useState("")
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [brightMode, setBrightMode] = useState(false)
  const [stats, setStats] = useState({
    total_scanned: 0,
    admitted: 0,
    invalid: 0,
    already_used: 0,
  })
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const supabase = createClient()

  // Audio feedback
  const playSound = (type: "success" | "error" | "warning") => {
    if (!soundEnabled) return

    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    switch (type) {
      case "success":
        oscillator.frequency.setValueAtTime(800, context.currentTime)
        oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1)
        break
      case "error":
        oscillator.frequency.setValueAtTime(300, context.currentTime)
        oscillator.frequency.setValueAtTime(200, context.currentTime + 0.2)
        break
      case "warning":
        oscillator.frequency.setValueAtTime(600, context.currentTime)
        break
    }

    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.3)
  }

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error("Camera access denied:", error)
      alert("Camera access is required for QR scanning. Please enable camera permissions.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Process check-in
  const processCheckin = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, scanner_id: user?.id }),
      })

      const result = await response.json()

      const scanResult: ScanResult = {
        success: result.success,
        message: result.message,
        ticket: result.ticket,
        timestamp: new Date(),
      }

      setScanResult(scanResult)

      if (result.success) {
        playSound("success")
        // Add to scan logs
        const newLog: ScanLog = {
          id: Date.now().toString(),
          ticket_id: result.ticket.id,
          event_title: result.ticket.event_title,
          holder_name: result.ticket.holder_name,
          status: "admitted",
          scanned_at: new Date().toISOString(),
          scanner_name: profile?.username || "Admin",
        }
        setScanLogs((prev) => [newLog, ...prev.slice(0, 19)]) // Keep last 20

        // Update stats
        setStats((prev) => ({
          ...prev,
          total_scanned: prev.total_scanned + 1,
          admitted: prev.admitted + 1,
        }))
      } else {
        playSound(result.message.includes("already") ? "warning" : "error")

        // Update stats for invalid/already used
        setStats((prev) => ({
          ...prev,
          total_scanned: prev.total_scanned + 1,
          [result.message.includes("already") ? "already_used" : "invalid"]:
            prev[result.message.includes("already") ? "already_used" : "invalid"] + 1,
        }))
      }

      // Clear result after 3 seconds
      setTimeout(() => setScanResult(null), 3000)
    } catch (error) {
      console.error("Check-in error:", error)
      setScanResult({
        success: false,
        message: "System error. Please try again.",
        timestamp: new Date(),
      })
      playSound("error")
    } finally {
      setLoading(false)
    }
  }

  // Handle manual entry
  const handleManualEntry = async () => {
    if (!manualEntry.trim()) return
    await processCheckin(manualEntry.trim())
    setManualEntry("")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Check admin permissions
  if (!user || !profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don't have permission to access the check-in system.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        brightMode ? "bg-white" : "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      }`}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${brightMode ? "text-black" : "text-white"}`}>
                  Event Check-in Scanner
                </h1>
                <p className={`${brightMode ? "text-gray-600" : "text-gray-300"}`}>
                  Scan QR codes to admit attendees to the event
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button
                  onClick={() => setBrightMode(!brightMode)}
                  variant="outline"
                  size="sm"
                  className={brightMode ? "border-gray-300" : "border-white/20"}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {brightMode ? "Normal" : "Bright"}
                </Button>

                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="outline"
                  size="sm"
                  className={brightMode ? "border-gray-300" : "border-white/20"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-400"}`}>Total Scanned</p>
                    <p className={`text-2xl font-bold ${brightMode ? "text-black" : "text-white"}`}>
                      {stats.total_scanned}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-400"}`}>Admitted</p>
                    <p className={`text-2xl font-bold ${brightMode ? "text-black" : "text-white"}`}>{stats.admitted}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-400"}`}>Already Used</p>
                    <p className={`text-2xl font-bold ${brightMode ? "text-black" : "text-white"}`}>
                      {stats.already_used}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-400"}`}>Invalid</p>
                    <p className={`text-2xl font-bold ${brightMode ? "text-black" : "text-white"}`}>{stats.invalid}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <div className="space-y-6">
              {/* Camera Scanner */}
              <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${brightMode ? "text-black" : "text-white"}`}>
                    <Camera className="w-5 h-5 mr-2" />
                    QR Code Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera View */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {isScanning ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                          </div>
                        </div>

                        {/* Scanning Animation */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <div className="w-48 h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                        </motion.div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">Camera not active</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button onClick={startCamera} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="destructive" className="flex-1">
                        <CameraOff className="w-4 h-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Entry */}
              <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${brightMode ? "text-black" : "text-white"}`}>
                    <Search className="w-5 h-5 mr-2" />
                    Manual Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter ticket ID or QR token"
                      value={manualEntry}
                      onChange={(e) => setManualEntry(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleManualEntry()}
                      className={brightMode ? "bg-white border-gray-300" : "bg-white/5 border-white/20 text-white"}
                      disabled={loading}
                    />
                    <Button
                      onClick={handleManualEntry}
                      disabled={!manualEntry.trim() || loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results and Logs */}
            <div className="space-y-6">
              {/* Scan Result */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert
                      className={`${scanResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                    >
                      <div className="flex items-center">
                        {scanResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <AlertDescription className={`ml-2 ${scanResult.success ? "text-green-800" : "text-red-800"}`}>
                          <div>
                            <p className="font-semibold">{scanResult.message}</p>
                            {scanResult.ticket && (
                              <div className="mt-2 text-sm">
                                <p>
                                  <strong>Event:</strong> {scanResult.ticket.event_title}
                                </p>
                                <p>
                                  <strong>Holder:</strong> {scanResult.ticket.holder_name}
                                </p>
                                <p>
                                  <strong>Time:</strong> {scanResult.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan Logs */}
              <Card className={brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${brightMode ? "text-black" : "text-white"}`}>
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Scans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanLogs.length === 0 ? (
                      <p className={`text-center py-8 ${brightMode ? "text-gray-500" : "text-gray-400"}`}>
                        No scans yet
                      </p>
                    ) : (
                      scanLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-lg border ${
                            brightMode ? "bg-gray-50 border-gray-200" : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              className={
                                log.status === "admitted"
                                  ? "bg-green-500 text-white"
                                  : log.status === "already_used"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-red-500 text-white"
                              }
                            >
                              {log.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className={`text-xs ${brightMode ? "text-gray-500" : "text-gray-400"}`}>
                              {new Date(log.scanned_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={`font-medium ${brightMode ? "text-black" : "text-white"}`}>{log.holder_name}</p>
                          <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-300"}`}>
                            {log.event_title}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
