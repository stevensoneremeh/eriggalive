"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Share2, Copy, CheckCircle } from "lucide-react"
import QRCodeLib from "qrcode"
import { useEffect } from "react"

interface Ticket {
  id: string
  ticket_number: string
  qr_code: string
  event_id: string
  status: string
  purchased_at: string
  event?: {
    title: string
    event_date: string
    venue: string
  }
}

interface QRCodeDisplayProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

export function QRCodeDisplay({ ticket, isOpen, onClose }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (ticket?.qr_code) {
      // Generate QR code data URL
      QRCodeLib.toDataURL(
        JSON.stringify({
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          qrCode: ticket.qr_code,
          eventId: ticket.event_id,
        }),
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#1e293b", // slate-800
            light: "#ffffff",
          },
        },
      )
        .then(setQrCodeDataUrl)
        .catch(console.error)
    }
  }, [ticket])

  if (!ticket) return null

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

  const handleCopyTicketNumber = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticket_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement("a")
    link.download = `erigga-ticket-${ticket.ticket_number}.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Erigga Live Ticket - ${ticket.event?.title}`,
          text: `My ticket for ${ticket.event?.title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
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
        return "bg-red-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Your Ticket
          </DialogTitle>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Ticket Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>
            <CardContent className="p-6 space-y-4">
              {/* Event Info */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">{ticket.event?.title || "Event Ticket"}</h3>
                {ticket.event?.venue && <p className="text-slate-400 text-sm">{ticket.event.venue}</p>}
                {ticket.event?.event_date && (
                  <p className="text-slate-300 text-sm mt-2">{formatDate(ticket.event.event_date)}</p>
                )}
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-white p-4 rounded-lg"
                >
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl || "/placeholder.svg"} alt="Ticket QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-200">
                      <QrCode className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Ticket Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ticket Number</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">{ticket.ticket_number}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyTicketNumber}
                      className="h-6 w-6 p-0 hover:bg-slate-700"
                    >
                      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Purchased</span>
                  <span className="text-sm text-slate-300">{new Date(ticket.purchased_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-400 text-xs text-center">
                  Present this QR code at the venue entrance for admission
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={!qrCodeDataUrl}
            >
              <Download className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
