"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, MapPin, Download, ArrowRight, Ticket, Home } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { TicketQRDisplay } from "@/components/tickets/ticket-qr-display"

interface TicketData {
  id: string
  ticket_number: string
  status: string
  price_paid: number
  ticket_type: string
  events: {
    title: string
    event_date: string
    event_time: string
    venue: string
    location: string
  }
}

export default function EventSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketId = searchParams.get("ticketId")
  const { user } = useAuth()

  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (ticketId && user) {
      fetchTicket()
    }
  }, [ticketId, user])

  const fetchTicket = async () => {
    if (!ticketId || !user) return

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          events (
            title,
            event_date,
            event_time,
            venue,
            location
          )
        `)
        .eq("id", ticketId)
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      setTicket(data)
    } catch (error) {
      console.error("Error fetching ticket:", error)
      setError("Failed to load ticket details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ticket Not Found</h2>
          <p className="text-gray-400 mb-6">{error || "Unable to load ticket details"}</p>
          <Button asChild className="bg-gradient-to-r from-red-500 to-orange-500">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-green-900/20" />
      <div className="absolute inset-0 bg-[url('/placeholder-kzlwg.png')] opacity-10 bg-cover bg-center" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Success Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-12 w-12 text-green-400" />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              textShadow: "0 0 30px rgba(34, 197, 94, 0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
            }}
          >
            PAYMENT SUCCESSFUL!
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your ticket has been confirmed and is ready to use
          </motion.p>

          <motion.p
            className="text-lg text-green-400 font-semibold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Ticket #{ticket.ticket_number}
          </motion.p>
        </motion.div>

        {/* Ticket Details */}
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2"></div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white mb-2">{ticket.events.title}</CardTitle>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Confirmed
                </Badge>
                <Badge variant="outline" className="text-gray-300 border-gray-500">
                  {ticket.ticket_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span>{new Date(ticket.events.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>{ticket.events.event_time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>
                    {ticket.events.venue}, {ticket.events.location}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 mb-2">
                  ₦{ticket.price_paid ? (ticket.price_paid / 100).toLocaleString() : "0"}
                </div>
                <p className="text-gray-400">Amount Paid</p>
              </div>

              {/* QR Code Display */}
              <div className="border-t border-gray-700 pt-6">
                <TicketQRDisplay ticket={ticket} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Your Ticket is Ready!</h3>
            <p className="text-gray-300 mb-4">
              Your ticket and QR code are now available in your tickets page. You can access them anytime from your
              dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
              >
                <Link href="/tickets">
                  <Ticket className="h-5 w-5 mr-2" />
                  View My Tickets
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
              >
                <Link href="/dashboard">
                  <Home className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Need help? Contact our support team or check your email for ticket confirmation.
            </p>
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-300"
              onClick={() => {
                const ticketData = `
ERIGGA FAN PLATFORM - TICKET CONFIRMATION
${ticket.events.title}
Venue: ${ticket.events.venue}, ${ticket.events.location}
Date: ${new Date(ticket.events.event_date).toLocaleDateString()}
Time: ${ticket.events.event_time}
Ticket #: ${ticket.ticket_number}
Status: ${ticket.status.toUpperCase()}
Amount Paid: ₦${ticket.price_paid ? (ticket.price_paid / 100).toLocaleString() : "0"}
                `
                const blob = new Blob([ticketData], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `erigga-ticket-${ticket.ticket_number}.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Ticket Details
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
