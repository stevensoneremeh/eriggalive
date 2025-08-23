"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  CameraOff,
  Scan,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MapPin,
  Ticket,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ScanResult {
  success: boolean
  message: string
  ticket?: {
    id: string
    ticket_number: string
    status: string
    used_at: string
    scanned_by: string
  }
  event?: {
    id: string
    title: string
    event_date: string
    venue: string
  }
  attendee?: {
    id: string
    email: string
    username?: string
  }
  error?: string
  code?: string
}

interface QRScannerProps {
  eventId?: string
  onScanSuccess?: (result: ScanResult) => void
}

export function QRScanner({ eventId, onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

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
      console.error("Camera access error:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or use manual input.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const processTicketData = async (ticketData: string) => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // Parse QR code data
      let parsedData
      try {
        parsedData = JSON.parse(ticketData)
      } catch {
        // If not JSON, treat as ticket number
        parsedData = { ticketNumber: ticketData }
      }

      const ticketId = parsedData.ticketId || parsedData.id
      const qrCode = parsedData.qrCode || parsedData.ticketNumber || ticketData

      if (!ticketId && !qrCode) {
        throw new Error("Invalid QR code format")
      }

      // Call scan API
      const response = await fetch("/api/admin/tickets/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          qrCode,
        }),
      })

      const result: ScanResult = await response.json()

      setLastScanResult(result)
      onScanSuccess?.(result)

      if (result.success) {
        toast({
          title: "Ticket Scanned Successfully",
          description: `${result.attendee?.email} checked in for ${result.event?.title}`,
        })
      } else {
        toast({
          title: "Scan Failed",
          description: result.error || "Invalid ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorResult: ScanResult = {
        success: false,
        message: "Scan failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }

      setLastScanResult(errorResult)
      toast({
        title: "Scan Error",
        description: errorResult.error,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualScan = () => {
    if (manualInput.trim()) {
      processTicketData(manualInput.trim())
      setManualInput("")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Scanner Interface */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Scan className="w-5 h-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Camera View */}
          {isScanning && (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
              <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
              </div>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Manual Ticket Entry</label>
            <div className="flex gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter ticket number or QR code data"
                className="bg-slate-800 border-slate-600 text-white"
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
              />
              <Button
                onClick={handleManualScan}
                disabled={!manualInput.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      <AnimatePresence>
        {lastScanResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card
              className={`border-2 ${lastScanResult.success ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {lastScanResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {lastScanResult.success ? "Check-in Successful" : "Check-in Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastScanResult.success && lastScanResult.ticket && lastScanResult.event && lastScanResult.attendee ? (
                  <div className="space-y-4">
                    {/* Event Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Event</span>
                        </div>
                        <p className="font-semibold text-white">{lastScanResult.event.title}</p>
                        <p className="text-sm text-slate-400">{formatDate(lastScanResult.event.event_date)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">Venue</span>
                        </div>
                        <p className="font-semibold text-white">{lastScanResult.event.venue}</p>
                      </div>
                    </div>

                    {/* Attendee Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Attendee</span>
                        </div>
                        <p className="font-semibold text-white">
                          {lastScanResult.attendee.username || lastScanResult.attendee.email}
                        </p>
                        <p className="text-sm text-slate-400">{lastScanResult.attendee.email}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Ticket className="w-4 h-4" />
                          <span className="text-sm">Ticket</span>
                        </div>
                        <p className="font-semibold text-white">{lastScanResult.ticket.ticket_number}</p>
                        <Badge className="bg-green-500 text-white">{lastScanResult.ticket.status.toUpperCase()}</Badge>
                      </div>
                    </div>

                    <Alert className="border-green-500 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-400">
                        Attendee successfully checked in at{" "}
                        {new Date(lastScanResult.ticket.used_at).toLocaleTimeString()}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400">
                      {lastScanResult.error || "Invalid or already used ticket"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
