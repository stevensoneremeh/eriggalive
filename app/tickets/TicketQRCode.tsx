"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User } from "lucide-react"

interface TicketQRCodeProps {
  ticket: {
    id: string
    qr_token_hash: string
    status: string
    event?: {
      title: string
      starts_at: string
      venue: string
    }
    user?: {
      username: string
      email: string
    }
  }
}

export function TicketQRCode({ ticket }: TicketQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Generate QR code visualization (simplified)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 200, 200)

    // Draw QR-like pattern
    ctx.fillStyle = "black"
    const size = 8
    const token = ticket.qr_token_hash || ticket.id

    // Create a simple pattern based on the token
    for (let i = 0; i < token.length && i < 400; i++) {
      const char = token.charCodeAt(i)
      const x = (i % 25) * size
      const y = Math.floor(i / 25) * size

      if (char % 2 === 0) {
        ctx.fillRect(x, y, size, size)
      }
    }

    // Add corner markers
    const drawCornerMarker = (x: number, y: number) => {
      ctx.fillRect(x, y, size * 3, size * 3)
      ctx.fillStyle = "white"
      ctx.fillRect(x + size, y + size, size, size)
      ctx.fillStyle = "black"
    }

    drawCornerMarker(0, 0)
    drawCornerMarker(200 - size * 3, 0)
    drawCornerMarker(0, 200 - size * 3)
  }, [ticket])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unused":
        return "bg-green-500 text-white"
      case "admitted":
        return "bg-blue-500 text-white"
      case "refunded":
        return "bg-yellow-500 text-white"
      case "invalid":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <canvas ref={canvasRef} width={200} height={200} className="border border-gray-200 rounded" />
        </div>
      </div>

      {/* Ticket Info */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{ticket.event?.title}</h3>
            <Badge className={getStatusColor(ticket.status)}>{ticket.status.toUpperCase()}</Badge>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            {ticket.event?.starts_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(ticket.event.starts_at)}</span>
              </div>
            )}

            {ticket.event?.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{ticket.event.venue}</span>
              </div>
            )}

            {ticket.user && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{ticket.user.username || ticket.user.email}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/20">
            <p className="text-xs text-gray-400 font-mono">Token: {ticket.qr_token_hash?.slice(0, 16)}...</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-300">Present this QR code at the event entrance</p>
      </div>
    </div>
  )
}
