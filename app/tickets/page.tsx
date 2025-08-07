"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, MapPin, Users, Clock, QrCode, Download, Share2, Sparkles, Music, Star } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"

// Enhanced events data with September concert
const events = [
  {
    id: "erigga-september-2025",
    title: "Erigga Live – September 2025",
    subtitle: "Intimate Session with THE GOAT",
    description:
      "Be part of history. Experience Erigga live in an intimate setting with special guests and surprise performances",
    venue: "The Playground",
    location: "Warri, Nigeria",
    date: "2025-09-03T20:00:00Z",
    price: 0, // Free event
    maxTickets: 200,
    ticketsSold: 45,
    image: "/erigga-poster.jpg",
    category: "Intimate Session",
    isVip: true,
    isSpecial: true,
    tags: ["Exclusive", "Limited", "VIP Access"],
  },
  {
    id: "1",
    title: "Warri Live Show 2024",
    description: "Experience Erigga live in his hometown with special guests and surprise performances",
    venue: "Warri City Stadium",
    location: "Warri, Delta State",
    date: "2024-12-25T20:00:00Z",
    price: 500000, // 5000 NGN in kobo
    maxTickets: 5000,
    ticketsSold: 3200,
    image: "/placeholder.svg?height=300&width=400",
    category: "Concert",
    isVip: false,
  },
  {
    id: "2",
    title: "Lagos Concert - Paper Boi Live",
    description: "The biggest Erigga concert in Lagos with full band and special effects",
    venue: "Eko Hotel Convention Centre",
    location: "Victoria Island, Lagos",
    date: "2025-01-15T19:00:00Z",
    price: 1000000, // 10000 NGN in kobo
    maxTickets: 3000,
    ticketsSold: 1800,
    image: "/placeholder.svg?height=300&width=400",
    category: "Concert",
    isVip: true,
  },
]

// Nigerian locations for reservation form
const NIGERIAN_LOCATIONS = [
  "Lagos",
  "Abuja",
  "Kano",
  "Ibadan",
  "Port Harcourt",
  "Benin City",
  "Kaduna",
  "Warri",
  "Jos",
  "Ilorin",
  "Aba",
  "Onitsha",
  "Enugu",
  "Calabar",
  "Akure",
  "Bauchi",
  "Sokoto",
  "Maiduguri",
  "Zaria",
  "Owerri",
  "Uyo",
  "Abeokuta",
  "Other",
]

// Erigga songs for reservation form
const ERIGGA_SONGS = [
  "The Erigma",
  "Area to the World",
  "Motivation",
  "Next Track",
  "Welcome to Warri",
  "Paper Boi",
  "Ketama",
  "Before the Fame",
  "A Very Very Good Bad Guy",
  "Puna Vibes",
  "Two Criminals",
  "Ayeme",
  "Quarantine Chronicles",
  "Other",
]

// Generate unique QR code (simplified version from v1)
const generateQRCode = (email: string, name: string): string => {
  const timestamp = Date.now()
  const hash = btoa(`${email}:${name}:${timestamp}`).slice(0, 16)
  return `EGG-${hash}-${timestamp.toString().slice(-6)}`
}

// Mock user tickets with enhanced data
const userTickets = [
  {
    id: "ticket-001",
    eventId: "erigga-september-2025",
    eventTitle: "Erigga Live – September 2025",
    venue: "The Playground",
    location: "Warri, Nigeria",
    date: "2025-09-03T20:00:00Z",
    ticketNumber: "EGG-ABC123XY-001523",
    qrCode: "EGG-ABC123XY-001523",
    status: "confirmed",
    purchasedAt: "2024-11-15T10:30:00Z",
    holderName: "John Doe",
    specialAccess: true,
  },
]

// Past events data
const pastEvents = [
  {
    id: "past-1",
    title: "Port Harcourt Takeover",
    venue: "Liberation Stadium",
    date: "2024-10-15T20:00:00Z",
    attendees: 8000,
    highlights: ["Surprise guest appearances", "New song premiere", "Fan interaction"],
  },
  {
    id: "past-2",
    title: "Benin City Vibes",
    venue: "Samuel Ogbemudia Stadium",
    date: "2024-09-20T19:30:00Z",
    attendees: 6500,
    highlights: ["Acoustic set", "Fan stories session", "Merchandise giveaway"],
  },
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
}

export default function TicketsPage() {
  const { user, profile, loading } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[0] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationData, setReservationData] = useState({
    fullName: "",
    email: "",
    location: "",
    password: "",
    favoriteTrack: "",
    message: "",
  })
  const [generatedTicket, setGeneratedTicket] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const formatPrice = (priceInKobo: number) => {
    if (priceInKobo === 0) return "FREE"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(priceInKobo / 100)
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

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate QR code and ticket
      const qrCode = generateQRCode(reservationData.email, reservationData.fullName)
      const newTicket = {
        id: `ticket-${Date.now()}`,
        eventId: "erigga-september-2025",
        eventTitle: "Erigga Live – September 2025",
        venue: "The Playground",
        location: "Warri, Nigeria",
        date: "2025-09-03T20:00:00Z",
        ticketNumber: qrCode,
        qrCode: qrCode,
        status: "confirmed",
        purchasedAt: new Date().toISOString(),
        holderName: reservationData.fullName,
        specialAccess: true,
        reservationDetails: {
          location: reservationData.location,
          favoriteTrack: reservationData.favoriteTrack,
          message: reservationData.message,
        },
      }

      setGeneratedTicket(newTicket)
      setShowReservationModal(false)
      setShowConfetti(true)

      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)

      // Reset form
      setReservationData({
        fullName: "",
        email: "",
        location: "",
        password: "",
        favoriteTrack: "",
        message: "",
      })
    } catch (error) {
      console.error("Reservation error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTicketPurchase = async (event: (typeof events)[0]) => {
    setIsProcessing(true)

    try {
      // Initialize Paystack payment for paid events
      const handler = (window as any).PaystackPop.setup({
        key: "pk_test_0123456789abcdef0123456789abcdef01234567",
        email: "user@example.com",
        amount: event.price,
        currency: "NGN",
        ref: `ticket_${event.id}_${Date.now()}`,
        metadata: {
          event_id: event.id,
          event_title: event.title,
          ticket_type: "general",
        },
        callback: (response: any) => {
          console.log("Payment successful:", response)
          alert(`Payment successful! Reference: ${response.reference}`)
        },
        onClose: () => {
          console.log("Payment window closed")
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTicket = (ticket: any) => {
    const ticketData = `
ERIGGA FAN PLATFORM - EXCLUSIVE TICKET
${ticket.eventTitle}
Venue: ${ticket.venue}, ${ticket.location}
Date: ${formatDate(ticket.date)}
Ticket #: ${ticket.ticketNumber}
Holder: ${ticket.holderName}
Status: ${ticket.status.toUpperCase()}
${ticket.specialAccess ? "VIP ACCESS GRANTED" : ""}
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `erigga-ticket-${ticket.ticketNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allTickets = generatedTicket ? [...userTickets, generatedTicket] : userTickets

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view your tickets.</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen py-8 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-48 h-48 bg-red-500/10 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Confetti Effect */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              className="fixed inset-0 pointer-events-none z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-orange-500 rounded-full"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -10,
                    rotate: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 10,
                    rotate: 360,
                    x: Math.random() * window.innerWidth,
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="font-street text-4xl md:text-6xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent mb-4"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              LIVE SHOWS
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Experience Erigga live. Feel the energy. Be part of the movement.
            </motion.p>
          </motion.div>

          {/* Your Tickets Section */}
          <AnimatePresence>
            {allTickets.length > 0 && (
              <motion.section className="mb-12" variants={containerVariants} initial="hidden" animate="visible">
                <motion.h2 className="text-2xl font-bold mb-6 flex items-center gap-2" variants={itemVariants}>
                  <QrCode className="h-6 w-6 text-orange-500" />
                  Your Tickets
                  {generatedTicket && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2">
                      <Badge className="bg-green-500 text-white">NEW!</Badge>
                    </motion.div>
                  )}
                </motion.h2>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                >
                  {allTickets.map((ticket, index) => (
                    <motion.div key={ticket.id} variants={itemVariants} whileHover={cardHoverVariants.hover} layout>
                      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/40 overflow-hidden relative">
                        {ticket.specialAccess && (
                          <motion.div
                            className="absolute top-2 right-2 z-10"
                            animate={{
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          >
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          </motion.div>
                        )}
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-500 text-white">{ticket.status}</Badge>
                            <QrCode className="h-5 w-5 text-orange-500" />
                          </div>
                          <CardTitle className="text-lg">{ticket.eventTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {ticket.venue}, {ticket.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(ticket.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Holder: {ticket.holderName}</span>
                            </div>
                          </div>

                          <motion.div
                            className="bg-background/50 p-3 rounded-lg text-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="w-20 h-20 mx-auto mb-2 bg-white p-2 rounded flex items-center justify-center">
                              <QrCode className="w-full h-full text-black" />
                            </div>
                            <p className="text-xs font-mono">{ticket.ticketNumber}</p>
                          </motion.div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                              onClick={() => downloadTicket(ticket)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-400 text-orange-400 bg-transparent"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Upcoming Events */}
          <motion.section className="mb-12" variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-2xl font-bold mb-6 flex items-center gap-2" variants={itemVariants}>
              <Calendar className="h-6 w-6 text-orange-500" />
              Upcoming Shows
            </motion.h2>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
              {events.map((event, index) => {
                const availableTickets = event.maxTickets - event.ticketsSold
                const soldOutPercentage = (event.ticketsSold / event.maxTickets) * 100

                return (
                  <motion.div key={event.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                    <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group overflow-hidden relative">
                      {event.isSpecial && (
                        <motion.div
                          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        />
                      )}
                      <CardHeader className="p-0">
                        <div className="relative">
                          <motion.img
                            src={event.image || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                          />
                          {event.isVip && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                                <Sparkles className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            </motion.div>
                          )}
                          <Badge className="absolute top-2 left-2 bg-orange-500 text-black">{event.category}</Badge>
                          {event.tags && (
                            <div className="absolute bottom-2 left-2 flex gap-1">
                              {event.tags.map((tag, tagIndex) => (
                                <motion.div
                                  key={tag}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: tagIndex * 0.1 }}
                                >
                                  <Badge variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                            {event.subtitle && (
                              <p className="text-sm text-orange-400 font-medium mb-2">{event.subtitle}</p>
                            )}
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              <span>
                                {event.venue}, {event.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-500" />
                              <span>{availableTickets} spots left</span>
                            </div>
                          </div>

                          {/* Availability bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Reserved</span>
                              <span>{soldOutPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${soldOutPercentage}%` }}
                                transition={{ delay: 0.5, duration: 1 }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <div>
                              <motion.span
                                className="text-2xl font-bold text-orange-500"
                                animate={
                                  event.price === 0
                                    ? {
                                        scale: [1, 1.1, 1],
                                        color: ["#f97316", "#ef4444", "#f97316"],
                                      }
                                    : {}
                                }
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeInOut",
                                }}
                              >
                                {formatPrice(event.price)}
                              </motion.span>
                            </div>

                            {event.id === "erigga-september-2025" ? (
                              <Button
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                disabled={availableTickets === 0}
                                onClick={() => setShowReservationModal(true)}
                              >
                                {availableTickets === 0 ? "Fully Reserved" : "Reserve Spot"}
                              </Button>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    className="bg-orange-500 hover:bg-orange-600 text-black"
                                    disabled={availableTickets === 0}
                                    onClick={() => setSelectedEvent(event)}
                                  >
                                    {availableTickets === 0 ? "Sold Out" : "Buy Ticket"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Purchase Ticket</DialogTitle>
                                  </DialogHeader>
                                  {selectedEvent && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold">{selectedEvent.title}</h4>
                                        <p className="text-sm text-muted-foreground">{selectedEvent.venue}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDate(selectedEvent.date)}
                                        </p>
                                      </div>

                                      <div className="bg-orange-500/10 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                          <span>Ticket Price:</span>
                                          <span className="text-xl font-bold text-orange-500">
                                            {formatPrice(selectedEvent.price)}
                                          </span>
                                        </div>
                                      </div>

                                      <Button
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                                        onClick={() => handleTicketPurchase(selectedEvent)}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? "Processing..." : "Pay with Paystack"}
                                      </Button>

                                      <p className="text-xs text-muted-foreground text-center">
                                        Secure payment powered by Paystack. You'll receive your ticket via email after
                                        payment.
                                      </p>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.section>

          {/* Past Shows */}
          <motion.section variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-2xl font-bold mb-6" variants={itemVariants}>
              Past Shows Recap
            </motion.h2>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants}>
              {pastEvents.map((event, index) => (
                <motion.div key={event.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                  <Card className="bg-card/50 border-orange-500/20">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.venue}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(event.date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold">{event.attendees.toLocaleString()} fans attended</span>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Highlights:</h4>
                          <ul className="space-y-1">
                            {event.highlights.map((highlight, highlightIndex) => (
                              <motion.li
                                key={highlightIndex}
                                className="text-sm text-muted-foreground flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: highlightIndex * 0.1 }}
                              >
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                {highlight}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        </div>

        {/* Reservation Modal */}
        <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-orange-500" />
                Reserve Your Spot
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReservation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={reservationData.fullName}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={reservationData.email}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={reservationData.location}
                  onValueChange={(value) => setReservationData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={reservationData.password}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="Create a password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteTrack">Favorite Erigga Track</Label>
                <Select
                  value={reservationData.favoriteTrack}
                  onValueChange={(value) => setReservationData((prev) => ({ ...prev, favoriteTrack: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track you want Erigga to perform" />
                  </SelectTrigger>
                  <SelectContent>
                    {ERIGGA_SONGS.map((song) => (
                      <SelectItem key={song} value={song}>
                        {song}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Erigga</Label>
                <Textarea
                  id="message"
                  value={reservationData.message}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Share your message with Erigga..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? "Reserving..." : "Reserve My Spot"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By reserving, you agree to receive updates about the event. Your spot is confirmed upon submission.
              </p>
            </form>
          </DialogContent>
        </Dialog>

        {/* Paystack Script */}
        <script src="https://js.paystack.co/v1/inline.js"></script>
      </div>
    </AuthGuard>
  )
}
