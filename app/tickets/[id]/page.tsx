"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Download, ArrowLeft, Smartphone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Ticket } from "@/lib/types/ticketing"
import Link from "next/link"

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [brightMode, setBrightMode] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTicket()

    // Listen for real-time updates
    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicket((prev) => (prev ? { ...prev, ...payload.new } : null))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const { data: ticketData, error } = await supabase
        .from("tickets")
        .select(`
          *,
          event:events_v2(*),
          payment:payments(*)
        `)
        .eq("id", ticketId)
        .single()

      if (error) throw error
      setTicket(ticketData)
    } catch (error) {
      console.error("Error fetching ticket:", error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Ticket Not Found</h2>
            <p className="text-gray-300 mb-6">
              The ticket you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Link href="/tickets">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAdmitted = ticket.status === "admitted"

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        brightMode ? "bg-white" : "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      }`}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              asChild
              variant="ghost"
              className={brightMode ? "text-black hover:bg-gray-100" : "text-white hover:bg-white/10"}
            >
              <Link href="/tickets">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </Link>
            </Button>
          </div>

          {/* Ticket Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card
              className={`${
                brightMode ? "bg-white border-gray-200" : "bg-white/5 backdrop-blur-xl border-white/10"
              } overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={`text-xl mb-2 ${brightMode ? "text-black" : "text-white"}`}>
                      {ticket.event?.title}
                    </CardTitle>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${brightMode ? "text-gray-600" : "text-gray-400"}`}>Ticket ID</p>
                    <p className={`font-mono text-sm ${brightMode ? "text-black" : "text-white"}`}>
                      {ticket.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`flex items-center gap-3 ${brightMode ? "text-gray-700" : "text-gray-300"}`}>
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <span>{formatDate(ticket.event?.starts_at || "")}</span>
                  </div>
                  <div className={`flex items-center gap-3 ${brightMode ? "text-gray-700" : "text-gray-300"}`}>
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span>{ticket.event?.venue}</span>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="text-center space-y-4">
                  <div
                    className={`relative inline-block p-4 rounded-lg ${
                      brightMode ? "bg-gray-50" : "bg-white/5"
                    } ${isAdmitted ? "opacity-50" : ""}`}
                  >
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <div className="text-center">
                        <div className="text-xs font-mono mb-2">QR CODE</div>
                        <div className="text-xs font-mono">{ticket.id.slice(0, 8)}</div>
                        <div className="text-xs font-mono mt-2">{ticket.status.toUpperCase()}</div>
                      </div>
                    </div>

                    {isAdmitted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">ADMITTED</div>
                      </div>
                    )}
                  </div>

                  {!isAdmitted && (
                    <div
                      className={`p-3 rounded-lg ${
                        brightMode ? "bg-blue-50 border border-blue-200" : "bg-blue-500/20 border border-blue-500/30"
                      }`}
                    >
                      <p className={`text-sm ${brightMode ? "text-blue-700" : "text-blue-200"}`}>
                        💡 This QR code will be scanned at the event entrance
                      </p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setBrightMode(!brightMode)}
                    variant="outline"
                    className={`flex-1 ${
                      brightMode
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    {brightMode ? "Normal Mode" : "Bright Mode"}
                  </Button>

                  <Button
                    variant="outline"
                    className={`flex-1 ${
                      brightMode
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                    disabled={isAdmitted}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {isAdmitted && (
                  <div
                    className={`text-center p-4 rounded-lg ${
                      brightMode ? "bg-green-50 border border-green-200" : "bg-green-500/20 border border-green-500/30"
                    }`}
                  >
                    <p className={`font-semibold ${brightMode ? "text-green-800" : "text-green-200"}`}>
                      ✅ Welcome to the event! Enjoy the show!
                    </p>
                    {ticket.admitted_at && (
                      <p className={`text-sm mt-1 ${brightMode ? "text-green-600" : "text-green-300"}`}>
                        Admitted at {formatDate(ticket.admitted_at)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
