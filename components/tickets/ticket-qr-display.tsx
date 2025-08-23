"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Share2, Copy, Check } from "lucide-react"
import { motion } from "framer-motion"

interface TicketQRDisplayProps {
  ticket: {
    id: string
    ticket_number: string
    qr_code: string
    qr_token: string
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

  // Generate QR code data URL (you might want to use a QR code library like qrcode)
  const generateQRCodeDataURL = (data: string) => {
    // This is a placeholder - in a real implementation, you'd use a QR code library
    // For now, we'll create a simple visual representation
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = 200
    canvas.height = 200

    if (ctx) {
      // Create a simple pattern for demonstration
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, 200, 200)
      ctx.fillStyle = "#FFFFFF"

      // Create a simple grid pattern
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(i * 10, j * 10, 10, 10)
          }
        }
      }

      // Add some random squares for uniqueness
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
    const dataURL = generateQRCodeDataURL(ticket.qr_code)
    const link = document.createElement("a")
    link.href = dataURL
    link.download = `ticket-qr-${ticket.ticket_number}.png`
    link.click()
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
      // Fallback to copying link
      copyToClipboard(window.location.href)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-500 text-white"
      case "used":
        return "bg-gray-500 text-white"
      case "expired":
        return "bg-red-500 text-white"
      case "cancelled":
        return "bg-red-500 text-white"
      default:
        return "bg-blue-500 text-white"
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
              <Badge className={getStatusColor(ticket.status)}>{ticket.status.toUpperCase()}</Badge>
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
            >
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={generateQRCodeDataURL(ticket.qr_code) || "/placeholder.svg"}
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* QR Code Info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Present this QR code at the venue entrance</p>
                <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded">
                  <code className="text-xs font-mono">{ticket.qr_code}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(ticket.qr_code)}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadQR} className="flex-1 bg-transparent">
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
