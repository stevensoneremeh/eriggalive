"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, QrCode, Download, Sparkles, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface Ticket {
  id: string
  ticket_number: string
  qr_code: string
  event_id: string
  payment_method: string
  amount_paid: number
  status: string
  purchased_at: string
  used_at?: string
  event?: {
    title: string
    event_date: string
    venue: string
    address?: string
  }
}

interface TicketCardProps {
  ticket: Ticket
  onViewQR: (ticket: Ticket) => void
  onDownload: (ticket: Ticket) => void
}

export function TicketCard({ ticket, onViewQR, onDownload }: TicketCardProps) {
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

  const formatPrice = (amountInKobo: number, paymentMethod: string) => {
    if (paymentMethod === "coins") {
      return `${amountInKobo.toLocaleString()} coins`
    }
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amountInKobo / 100)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4" />
      case "used":
        return <Sparkles className="w-4 h-4" />
      case "expired":
        return <XCircle className="w-4 h-4" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.2,
      },
    },
  }

  return (
    <motion.div whileHover={cardHoverVariants.hover}>
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-white text-lg mb-2">{ticket.event?.title || "Event Ticket"}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(ticket.status)}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-gray-300 border-gray-500">
                  {ticket.payment_method === "coins" ? "Coins" : "Card"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{formatPrice(ticket.amount_paid, ticket.payment_method)}</p>
              <p className="text-xs text-gray-400">#{ticket.ticket_number}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {ticket.event && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>{formatDate(ticket.event.event_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="truncate">{ticket.event.venue}</span>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-300">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Purchased: {new Date(ticket.purchased_at).toLocaleDateString()}</span>
            </div>
            {ticket.used_at && (
              <div className="flex items-center gap-2 text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>Used: {new Date(ticket.used_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewQR(ticket)}
              className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
            >
              <QrCode className="w-4 h-4 mr-2" />
              View QR
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(ticket)}
              className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
