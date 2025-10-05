"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Ticket, Star, Music, Phone, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function EventsPage() {
  const [loading, setLoading] = useState(false)

  const paystackTicketsEnabled = process.env.NEXT_PUBLIC_FEATURE_PAYSTACK_TICKETS === "true"
  const ticketFixedPrice = 20000

  const event = {
    id: "erigga-intimate-session-2025",
    title: "Erigga Live – 3rd September",
    description:
      "Intimate Session with THE GOAT - An exclusive evening with Nigeria's rap legend in an intimate setting",
    event_type: "concert",
    venue: "Uncle Jaffi at The Playground",
    address: "The Playground",
    city: "Warri, Nigeria",
    event_date: "2025-09-03T20:00:00",
    max_capacity: 200,
    current_attendance: 45,
    ticket_price_naira: ticketFixedPrice,
    ticket_price_coins: 10000,
    original_price_naira: 50000,
    image_url: "/events/erigga-intimate-session.png",
    status: "upcoming",
    is_featured: true,
    contact: "09035418185",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDirectCheckout = async () => {
    if (!paystackTicketsEnabled) {
      // Fallback to survey flow
      window.location.href = `/events/survey?event=${event.id}`
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/tickets/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          surveyData: null, // Skip survey for direct checkout
          amount: ticketFixedPrice,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed")
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch (error: any) {
      console.error("Checkout error:", error)
      alert(`Checkout failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900/20" />
      <div className="absolute inset-0 bg-[url('/placeholder-kzlwg.png')] opacity-10 bg-cover bg-center" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textShadow: "0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3)",
              fontFamily: "Impact, Arial Black, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            ERIGGA LIVE
          </motion.h1>
          <motion.div
            className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              textShadow: "0 0 20px rgba(251, 191, 36, 0.8)",
              fontFamily: "Impact, Arial Black, sans-serif",
            }}
          >
            Intimate Session with THE GOAT
          </motion.div>
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            An exclusive evening with Nigeria's rap legend in an intimate setting
          </motion.p>
          {paystackTicketsEnabled && (
            <motion.p
              className="text-lg text-green-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              🎫 Fixed ticket price: ₦{ticketFixedPrice.toLocaleString()}
            </motion.p>
          )}
        </div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 group">
            <div className="relative h-96 md:h-[500px] overflow-hidden">
              <Image
                src={event.image_url || "/placeholder.svg"}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Neon overlay effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10" />

              {/* Featured badge with neon effect */}
              <div className="absolute top-6 left-6">
                <Badge className="bg-yellow-500 text-black font-bold px-4 py-2 text-sm shadow-lg shadow-yellow-500/50">
                  <Star className="h-4 w-4 mr-2" />
                  EXCLUSIVE EVENT
                </Badge>
              </div>

              {/* Event type badge */}
              <div className="absolute top-6 right-6">
                <Badge className="bg-red-600 text-white font-bold px-4 py-2 text-sm shadow-lg shadow-red-600/50">
                  <Music className="h-4 w-4 mr-2" />
                  LIVE CONCERT
                </Badge>
              </div>

              {/* Event title overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h2
                  className="text-4xl md:text-5xl font-black text-white mb-2"
                  style={{
                    textShadow: "0 0 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(239, 68, 68, 0.5)",
                    fontFamily: "Impact, Arial Black, sans-serif",
                  }}
                >
                  {event.title}
                </h2>
              </div>
            </div>

            <CardContent className="p-8 bg-gradient-to-br from-gray-900 to-black">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-blue-500/20 rounded-full border border-blue-500/30">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Date & Time</div>
                      <div className="text-blue-400">{formatDate(event.event_date)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-orange-500/20 rounded-full border border-orange-500/30">
                      <MapPin className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Location</div>
                      <div className="text-orange-400">{event.venue}</div>
                      <div className="text-gray-400 text-sm">{event.city}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-green-500/20 rounded-full border border-green-500/30">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Attendance</div>
                      <div className="text-green-400">
                        {event.current_attendance}/{event.max_capacity} confirmed
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-purple-500/20 rounded-full border border-purple-500/30">
                      <Phone className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Reservations</div>
                      <div className="text-purple-400">{event.contact}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Ticket Price</h3>
                    <div className="text-center">
                      <div className="space-y-2">
                        <div className="text-lg text-gray-400 line-through">
                          {formatCurrency(event.original_price_naira)}
                        </div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                          {formatCurrency(event.ticket_price_naira)}
                        </div>
                      </div>
                      <div className="text-lg text-yellow-400 font-semibold mt-2">
                        OR {event.ticket_price_coins.toLocaleString()} Erigga Coins
                      </div>
                    </div>
                  </div>

                  {/* Capacity indicator */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>Availability</span>
                      <span>
                        {Math.round(((event.max_capacity - event.current_attendance) / event.max_capacity) * 100)}%
                        available
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-green-500/30"
                        style={{
                          width: `${Math.max(((event.max_capacity - event.current_attendance) / event.max_capacity) * 100, 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {paystackTicketsEnabled ? (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-700 hover:via-orange-600 hover:to-yellow-600 text-white font-black text-xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
                    onClick={handleDirectCheckout}
                    disabled={loading}
                    style={{
                      boxShadow: "0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Ticket className="h-6 w-6 mr-3" />
                        BUY TICKET - ₦{ticketFixedPrice.toLocaleString()}
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href={`/events/survey?event=${event.id}`}>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-700 hover:via-orange-600 hover:to-yellow-600 text-white font-black text-xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
                      style={{
                        boxShadow: "0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      <Ticket className="h-6 w-6 mr-3" />
                      BUY TICKET NOW
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
