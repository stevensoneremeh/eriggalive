"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Clock, QrCode, Download } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import type { Ticket } from "@/lib/types/ticketing"

interface TicketCardProps {
  ticket: Ticket & {
    events: {
      title: string
      venue: string
      event_date: string
      ticket_price: number
    }
    qr_token?: string
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false)

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const downloadTicket = () => {
    const ticketData = `
ERIGGA FAN PLATFORM - TICKET
${ticket.events.title}
Venue: ${ticket.events.venue}
Date: ${formatDate(ticket.events.event_date)}
Ticket ID: ${ticket.id}
Status: ${ticket.status.toUpperCase()}
Price: ₦${ticket.events.ticket_price.toLocaleString()}

Present this ticket and QR code at the venue.
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `erigga-ticket-${ticket.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2">{ticket.events.title}</CardTitle>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">₦{ticket.events.ticket_price.toLocaleString()}</p>
            <p className="text-xs text-gray-400">#{ticket.id.slice(0, 8)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>{new Date(ticket.events.event_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{new Date(ticket.events.event_date).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span className="truncate">{ticket.events.venue}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
              >
                <QrCode className="w-4 h-4 mr-2" />
                View QR
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Ticket QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={ticket.qr_token || ticket.qr_token_hash} size={200} />
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Present this QR code at the venue</p>
                  <p className="text-gray-400 text-xs mt-1">Ticket ID: {ticket.id.slice(0, 8)}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="outline"
            onClick={downloadTicket}
            className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
