"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, CheckCircle, XCircle, AlertTriangle, Scan, MapPin, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ScanResult {
  success: boolean
  result: "valid" | "invalid" | "already_used" | "expired" | "wrong_event"
  message?: string
  error?: string
  ticket?: {
    id: string
    ticket_number: string
    ticket_type: string
    event_title: string
    event_date: string
    venue: string
    holder_name: string
    holder_email: string
    checked_in_at: string
    checked_in_by: string
    used_at?: string
  }
}

interface QRScannerProps {
  eventId?: string
  scanLocation?: string
  onScanResult?: (result: ScanResult) => void
}

export function QRScanner({ eventId, scanLocation = "Main Entrance", onScanResult }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualEntry, setManualEntry] = useState("")
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please use manual entry.")
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

  // Validate ticket via API
  const validateTicket = async (qrCode: string, qrToken?: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode,
          qrToken,
          eventId,
          scanLocation,
        }),
      })

      const result: ScanResult = await response.json()

      setScanResult(result)
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10 scans

      if (onScanResult) {
        onScanResult(result)
      }

      // Auto-clear result after 5 seconds for successful scans
      if (result.success) {
        setTimeout(() => setScanResult(null), 5000)
      }
    } catch (error) {
      console.error("Validation error:", error)
      const errorResult: ScanResult = {
        success: false,
        result: "invalid",
        error: "Network error. Please try again.",
      }
      setScanResult(errorResult)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle manual QR code entry
  const handleManualEntry = () => {
    if (!manualEntry.trim()) return

    // Parse QR code format: ERIGGA-{eventId}-{userId}-{timestamp}
    const parts = manualEntry.split("-")
    if (parts.length >= 4 && parts[0] === "ERIGGA") {
      validateTicket(manualEntry)
    } else {
      // Try as ticket number
      validateTicket(manualEntry)
    }

    setManualEntry("")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const getResultIcon = (result: string) => {
    switch (result) {
      case "valid":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "already_used":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case "expired":
      case "wrong_event":
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "valid":
        return "border-green-500 bg-green-50"
      case "already_used":
        return "border-yellow-500 bg-yellow-50"
      default:
        return "border-red-500 bg-red-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Camera View */}
          {isScanning && (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
              <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual Entry</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter QR code or ticket number"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualEntry()}
              />
              <Button onClick={handleManualEntry} disabled={!manualEntry.trim() || isProcessing}>
                {isProcessing ? "Validating..." : "Validate"}
              </Button>
            </div>
          </div>

          {/* Scan Location Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Scanning at: {scanLocation}</span>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className={`border-2 ${getResultColor(scanResult.result)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getResultIcon(scanResult.result)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={scanResult.success ? "default" : "destructive"}>
                        {scanResult.result.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-medium mb-2">{scanResult.success ? scanResult.message : scanResult.error}</p>

                    {scanResult.ticket && (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Ticket:</span> {scanResult.ticket.ticket_number}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {scanResult.ticket.ticket_type}
                          </div>
                          <div>
                            <span className="font-medium">Holder:</span> {scanResult.ticket.holder_name}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {scanResult.ticket.holder_email}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Event:</span> {scanResult.ticket.event_title}
                        </div>
                        {scanResult.ticket.used_at && (
                          <div className="text-yellow-600">
                            <span className="font-medium">Previously used at:</span>{" "}
                            {new Date(scanResult.ticket.used_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getResultIcon(scan.result)}
                    <div>
                      <p className="font-medium">{scan.ticket?.holder_name || "Unknown"}</p>
                      <p className="text-sm text-gray-600">{scan.ticket?.ticket_number || "Invalid ticket"}</p>
                    </div>
                  </div>
                  <Badge variant={scan.success ? "default" : "destructive"}>{scan.result.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
