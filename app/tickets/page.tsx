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
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  QrCode,
  Download,
  Share2,
  Sparkles,
  Music,
  CheckCircle,
  Gift,
  Zap,
  TicketIcon,
  ArrowRight,
  Shield,
  Crown,
} from "lucide-react"
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
    image: "/erigga/hero/erigga-main-hero.jpeg",
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
    image: "/images/hero/erigga1.jpeg",
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
    image: "/images/hero/erigga2.jpeg",
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

const glowVariants = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(168, 85, 247, 0.4)",
      "0 0 40px rgba(168, 85, 247, 0.6)",
      "0 0 20px rgba(168, 85, 247, 0.4)",
    ],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Shield className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-white">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to view your tickets and events.</p>
          <Button
            asChild
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <a href="/login">Sign In</a>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      >
        {/* Futuristic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl"
            animate={{
              x: [-100, 100, -100],
              y: [-50, 50, -50],
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
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
              {[...Array(100)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  }}
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

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                LIVE EVENTS
              </motion.h1>
              <motion.p
                className="text-xl text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Experience the future of live entertainment. Secure your spot in the metaverse of music.
              </motion.p>
            </motion.div>

            {/* Your Tickets Section */}
            <AnimatePresence>
              {allTickets.length > 0 && (
                <motion.section className="mb-16" variants={containerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                        <TicketIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white">Your Digital Tickets</h2>
                        <p className="text-gray-400">Manage your exclusive access passes</p>
                      </div>
                      {generatedTicket && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-4">
                          <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1">
                            <Gift className="h-4 w-4 mr-1" />
                            NEW TICKET!
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-purple-400 border-purple-400 px-4 py-2">
                      {allTickets.length} ticket{allTickets.length !== 1 ? "s" : ""}
                    </Badge>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                  >
                    {allTickets.map((ticket, index) => (
                      <motion.div key={ticket.id} variants={itemVariants} whileHover={cardHoverVariants.hover} layout>
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden relative group">
                          {ticket.specialAccess && (
                            <motion.div
                              className="absolute top-4 right-4 z-10"
                              animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }}
                            >
                              <Crown className="h-6 w-6 text-yellow-400 drop-shadow-lg" />
                            </motion.div>
                          )}

                          {/* Holographic Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {ticket.status.toUpperCase()}
                              </Badge>
                              <QrCode className="h-6 w-6 text-purple-400" />
                            </div>
                            <CardTitle className="text-xl text-white">{ticket.eventTitle}</CardTitle>
                          </CardHeader>

                          <CardContent className="space-y-6 p-6">
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-purple-400" />
                                <span className="text-gray-300 font-medium">
                                  {ticket.venue}, {ticket.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-blue-400" />
                                <span className="text-gray-300">{formatDate(ticket.date)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-green-400" />
                                <span className="text-gray-300">Holder: {ticket.holderName}</span>
                              </div>
                            </div>

                            <motion.div
                              className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-2xl text-center border border-white/10"
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                              variants={glowVariants}
                              animate="animate"
                            >
                              <div className="w-24 h-24 mx-auto mb-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                                <QrCode className="w-full h-full text-white" />
                              </div>
                              <p className="text-xs font-mono text-gray-300 break-all bg-black/20 p-2 rounded">
                                {ticket.ticketNumber}
                              </p>
                            </motion.div>

                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                                onClick={() => downloadTicket(ticket)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-400 text-purple-400 hover:bg-purple-400/10 bg-transparent"
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
            <motion.section className="mb-16" variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
                    <p className="text-gray-400">Don't miss these exclusive experiences</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-400 border-orange-400 px-4 py-2">
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </Badge>
              </motion.div>

              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants}>
                {events.map((event, index) => {
                  const availableTickets = event.maxTickets - event.ticketsSold
                  const soldOutPercentage = (event.ticketsSold / event.maxTickets) * 100

                  return (
                    <motion.div key={event.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                      <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all group overflow-hidden relative">
                        {event.isSpecial && (
                          <motion.div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                          />
                        )}

                        <CardHeader className="p-0">
                          <div className="relative">
                            <motion.img
                              src={event.image || "/placeholder.svg"}
                              alt={event.title}
                              className="w-full h-56 object-cover"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {event.isVip && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.3 }}
                                className="absolute top-4 right-4"
                              >
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  VIP
                                </Badge>
                              </motion.div>
                            )}

                            <Badge className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                              {event.category}
                            </Badge>

                            {event.tags && (
                              <div className="absolute bottom-4 left-4 flex gap-2">
                                {event.tags.map((tag, tagIndex) => (
                                  <motion.div
                                    key={tag}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: tagIndex * 0.1 }}
                                  >
                                    <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                                      {tag}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="p-6">
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-xl mb-2 text-white">{event.title}</h3>
                              {event.subtitle && (
                                <p className="text-sm text-orange-400 font-medium mb-3">{event.subtitle}</p>
                              )}
                              <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
                            </div>

                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-purple-400" />
                                <span className="text-gray-300">
                                  {event.venue}, {event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <span className="text-gray-300">{formatDate(event.date)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-green-400" />
                                <span className="text-gray-300">{availableTickets} spots remaining</span>
                              </div>
                            </div>

                            {/* Availability Progress */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Capacity</span>
                                <span>{soldOutPercentage.toFixed(0)}% filled</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${soldOutPercentage}%` }}
                                  transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                              <div>
                                <motion.span
                                  className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"
                                  animate={
                                    event.price === 0
                                      ? {
                                          scale: [1, 1.05, 1],
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
                                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                                  disabled={availableTickets === 0}
                                  onClick={() => setShowReservationModal(true)}
                                >
                                  {availableTickets === 0 ? (
                                    "Fully Reserved"
                                  ) : (
                                    <>
                                      Reserve Spot
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                                      disabled={availableTickets === 0}
                                      onClick={() => setSelectedEvent(event)}
                                    >
                                      {availableTickets === 0 ? (
                                        "Sold Out"
                                      ) : (
                                        <>
                                          Get Ticket
                                          <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                      )}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md bg-slate-900 border-white/10">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">Secure Your Ticket</DialogTitle>
                                    </DialogHeader>
                                    {selectedEvent && (
                                      <div className="space-y-6">
                                        <div className="text-center">
                                          <h4 className="font-semibold text-lg text-white">{selectedEvent.title}</h4>
                                          <p className="text-sm text-gray-400">{selectedEvent.venue}</p>
                                          <p className="text-sm text-gray-400">{formatDate(selectedEvent.date)}</p>
                                        </div>

                                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-2xl border border-white/10">
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Ticket Price:</span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                              {formatPrice(selectedEvent.price)}
                                            </span>
                                          </div>
                                        </div>

                                        <Button
                                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 h-12"
                                          onClick={() => handleTicketPurchase(selectedEvent)}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? (
                                            <>
                                              <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                  duration: 1,
                                                  repeat: Number.POSITIVE_INFINITY,
                                                  ease: "linear",
                                                }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                              />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <Shield className="mr-2 h-4 w-4" />
                                              Secure Payment with Paystack
                                            </>
                                          )}
                                        </Button>

                                        <p className="text-xs text-gray-400 text-center">
                                          🔒 Your payment is secured with bank-level encryption. Ticket will be
                                          delivered instantly via email.
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
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Event Archives</h2>
                    <p className="text-gray-400">Relive the legendary moments</p>
                  </div>
                </div>
              </motion.div>

              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants}>
                {pastEvents.map((event, index) => (
                  <motion.div key={event.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-xl text-white mb-2">{event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {event.venue}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(event.date)}
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-2xl border border-white/10">
                            <Users className="h-6 w-6 text-blue-400" />
                            <div>
                              <span className="text-2xl font-bold text-white">{event.attendees.toLocaleString()}</span>
                              <p className="text-sm text-gray-400">fans experienced the magic</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                              <Sparkles className="h-4 w-4 text-yellow-400" />
                              Event Highlights
                            </h4>
                            <ul className="space-y-2">
                              {event.highlights.map((highlight, highlightIndex) => (
                                <motion.li
                                  key={highlightIndex}
                                  className="text-sm text-gray-300 flex items-center gap-3"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: highlightIndex * 0.1 }}
                                >
                                  <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full" />
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
        </div>

        {/* Reservation Modal */}
        <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Music className="h-5 w-5 text-orange-500" />
                Reserve Your Exclusive Spot
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReservation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={reservationData.fullName}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                  placeholder="Enter your full name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={reservationData.email}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300">
                  Location
                </Label>
                <Select
                  value={reservationData.location}
                  onValueChange={(value) => setReservationData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {NIGERIAN_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location} className="text-white hover:bg-white/10">
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={reservationData.password}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="Create a password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteTrack" className="text-gray-300">
                  Favorite Erigga Track
                </Label>
                <Select
                  value={reservationData.favoriteTrack}
                  onValueChange={(value) => setReservationData((prev) => ({ ...prev, favoriteTrack: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a track you want Erigga to perform" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {ERIGGA_SONGS.map((song) => (
                      <SelectItem key={song} value={song} className="text-white hover:bg-white/10">
                        {song}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">
                  Message to Erigga
                </Label>
                <Textarea
                  id="message"
                  value={reservationData.message}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Share your message with Erigga..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 h-12"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Securing Your Spot...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Reserve My Exclusive Spot
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                🎵 By reserving, you agree to receive exclusive updates about the event. Your spot is instantly
                confirmed upon submission.
              </p>
            </form>
          </DialogContent>
        </Dialog>

        {/* Paystack Script */}
        <script src="https://js.paystack.co/v1/inline.js"></script>
      </motion.div>
    </AuthGuard>
  )
}
