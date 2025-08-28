"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Share2, Copy, Check } from "lucide-react"
import { motion } from "framer-motion"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface TicketQRDisplayProps {
  ticket: {
    id: string
    ticket_number: string
    qr_code: string
    qr_token?: string
    event_title: string
    event_date: string
    venue: string
    ticket_type: string
    status: string
    holder_name?: string
  }
  showDetails?: boolean
}

export function TicketQRDisplay({ ticket, showDetails = true }: TicketQRDisplayProps) {
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("")

  const generateQRCodeDataURL = async (data: string) => {
    if (FEATURE_UI_FIXES_V1) {
      // Use proper QR code generation
      try {
        // For now, we'll use a canvas-based approach
        // In production, you'd want to use a library like 'qrcode'
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const size = 256
        canvas.width = size
        canvas.height = size

        if (ctx) {
          // White background
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, size, size)

          // Black border
          ctx.fillStyle = "#000000"
          ctx.fillRect(0, 0, size, 8) // Top
          ctx.fillRect(0, size - 8, size, 8) // Bottom
          ctx.fillRect(0, 0, 8, size) // Left
          ctx.fillRect(size - 8, 0, 8, size) // Right

          // Generate pattern based on data hash
          const hash = data.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0)
            return a & a
          }, 0)

          const gridSize = 8
          const cellSize = (size - 16) / gridSize // Account for border

          // Create QR-like pattern
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              const cellHash = (hash + i * gridSize + j) % 1000
              if (cellHash % 3 === 0) {
                // Roughly 1/3 of cells will be black
                ctx.fillStyle = "#000000"
                ctx.fillRect(8 + i * cellSize, 8 + j * cellSize, cellSize - 1, cellSize - 1)
              }
            }
          }

          // Add corner markers (finder patterns)
          const markerSize = cellSize * 2
          // Top-left
          ctx.fillStyle = "#000000"
          ctx.fillRect(8, 8, markerSize, markerSize)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(8 + cellSize / 2, 8 + cellSize / 2, markerSize - cellSize, markerSize - cellSize)

          // Top-right
          ctx.fillStyle = "#000000"
          ctx.fillRect(size - 8 - markerSize, 8, markerSize, markerSize)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(
            size - 8 - markerSize + cellSize / 2,
            8 + cellSize / 2,
            markerSize - cellSize,
            markerSize - cellSize,
          )

          // Bottom-left
          ctx.fillStyle = "#000000"
          ctx.fillRect(8, size - 8 - markerSize, markerSize, markerSize)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(
            8 + cellSize / 2,
            size - 8 - markerSize + cellSize / 2,
            markerSize - cellSize,
            markerSize - cellSize,
          )
        }

        return canvas.toDataURL()
      } catch (error) {
        console.error("Error generating QR code:", error)
        return "/placeholder.svg"
      }
    } else {
      // Legacy simple pattern
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      canvas.width = 200
      canvas.height = 200

      if (ctx) {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, 200, 200)
        ctx.fillStyle = "#FFFFFF"

        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if ((i + j) % 2 === 0) {
              ctx.fillRect(i * 10, j * 10, 10, 10)
            }
          }
        }

        const hash = data.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0)

        const random = new Array(10).fill(0).map((_, i) => (hash + i) % 400)
        random.forEach((pos, i) => {
          const x = (pos % 20) * 10
          const y = Math.floor(pos / 20) * 10
          ctx.fillStyle = i % 2 === 0 ? "#000000" : "#FFFFFF"
          ctx.fillRect(x, y, 10, 10)
        })
      }

      return canvas.toDataURL()
    }
  }

  useEffect(() => {
    if (showQR && !qrCodeDataURL) {
      generateQRCodeDataURL(ticket.qr_code).then(setQrCodeDataURL)
    }
  }, [showQR, ticket.qr_code, qrCodeDataURL])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const downloadQR = () => {
    if (qrCodeDataURL) {
      const link = document.createElement("a")
      link.href = qrCodeDataURL
      link.download = `ticket-qr-${ticket.ticket_number}.png`
      link.click()
    }
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket.event_title}`,
          text: `My ticket for ${ticket.event_title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyToClipboard(window.location.href)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
      case "unused":
        return "bg-green-500 text-white"
      case "used":
      case "admitted":
        return "bg-gray-500 text-white"
      case "expired":
        return "bg-red-500 text-white"
      case "cancelled":
        return "bg-red-500 text-white"
      default:
        return "bg-blue-500 text-white"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "unused":
        return "UNUSED"
      case "admitted":
        return "ADMITTED"
      default:
        return status.toUpperCase()
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{ticket.event_title}</h3>
              <p className="text-purple-100">{ticket.venue}</p>
              <p className="text-sm text-purple-200">
                {new Date(ticket.event_date).toLocaleDateString("en-NG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(ticket.status)}>{getStatusText(ticket.status)}</Badge>
              <p className="text-sm text-purple-200 mt-1">{ticket.ticket_type}</p>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        {showDetails && (
          <div className="p-4 border-b">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Ticket Number:</span>
                <p className="font-mono">{ticket.ticket_number}</p>
              </div>
              {ticket.holder_name && (
                <div>
                  <span className="font-medium text-gray-600">Holder:</span>
                  <p>{ticket.holder_name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div className="p-4">
          {!showQR ? (
            <Button
              onClick={() => setShowQR(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
              disabled={ticket.status === "admitted" && FEATURE_UI_FIXES_V1}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {ticket.status === "admitted" && FEATURE_UI_FIXES_V1 ? "Ticket Used" : "Show QR Code"}
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div
                  className={`bg-white p-4 rounded-lg border-2 border-gray-200 ${ticket.status === "admitted" && FEATURE_UI_FIXES_V1 ? "opacity-50 blur-sm" : ""}`}
                >
                  {qrCodeDataURL ? (
                    <img src={qrCodeDataURL || "/placeholder.svg"} alt="Ticket QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 animate-pulse rounded flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Info */}
              <div className="text-center space-y-2">
                {ticket.status === "admitted" && FEATURE_UI_FIXES_V1 ? (
                  <p className="text-sm text-red-600 font-medium">This ticket has been used for admission</p>
                ) : (
                  <p className="text-sm text-gray-600">Present this QR code at the venue entrance</p>
                )}
                <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded">
                  <code className="text-xs font-mono truncate max-w-[200px]">
                    {FEATURE_UI_FIXES_V1 ? ticket.qr_token || ticket.qr_code : ticket.qr_code}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(ticket.qr_code)}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQR}
                  className="flex-1 bg-transparent"
                  disabled={!qrCodeDataURL || (ticket.status === "admitted" && FEATURE_UI_FIXES_V1)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={shareTicket} className="flex-1 bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowQR(false)} className="flex-1">
                  Hide QR
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
