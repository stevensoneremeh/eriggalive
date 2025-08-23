"use client"

import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  QrCode,
  Download,
  Music,
  Gift,
  Shield,
  Search,
  Filter,
  Ticket,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { TicketQRDisplay } from "@/components/tickets/ticket-qr-display"

interface TicketData {
  id: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venue: string
  ticketType: string
  price: number
  status: "confirmed" | "pending" | "used" | "expired"
  qrCode: string
  seatNumber?: string
  description?: string
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  venue: string
  price: number
  capacity: number
  sold: number
  image: string
  category: string
}

const mockTickets: TicketData[] = [
  {
    id: "TKT001",
    eventTitle: "Erigga Live Concert 2024",
    eventDate: "2024-03-15",
    eventTime: "8:00 PM",
    venue: "Eko Convention Centre, Lagos",
    ticketType: "VIP",
    price: 15000,
    status: "confirmed",
    qrCode: "QR123456789",
    seatNumber: "A12",
    description: "VIP access with meet and greet",
  },
  {
    id: "TKT002",
    eventTitle: "Paper Boi Album Launch",
    eventDate: "2024-04-20",
    eventTime: "7:00 PM",
    venue: "Terra Kulture, Victoria Island",
    ticketType: "Regular",
    price: 5000,
    status: "pending",
    qrCode: "QR987654321",
    description: "Exclusive album launch event",
  },
]

// Enhanced events data with September concert
const eventsData = [
  {
    id: "erigga-september-2025",
    title: "Erigga Live – September 2025",
    description:
      "Be part of history. Experience Erigga live in an intimate setting with special guests and surprise performances",
    date: "2025-09-03",
    time: "20:00",
    venue: "The Playground",
    price: 0, // Free event
    capacity: 200,
    sold: 45,
    image: "/erigga/hero/erigga-main-hero.jpeg",
    category: "Intimate Session",
  },
  {
    id: "1",
    title: "Warri Live Show 2024",
    description: "Experience Erigga live in his hometown with special guests and surprise performances",
    date: "2024-12-25",
    time: "20:00",
    venue: "Warri City Stadium",
    price: 500000, // 5000 NGN in kobo
    capacity: 5000,
    sold: 3200,
    image: "/images/hero/erigga1.jpeg",
    category: "Concert",
  },
  {
    id: "2",
    title: "Lagos Concert - Paper Boi Live",
    description: "The biggest Erigga concert in Lagos with full band and special effects",
    date: "2025-01-15",
    time: "19:00",
    venue: "Eko Hotel Convention Centre",
    price: 1000000, // 10000 NGN in kobo
    capacity: 3000,
    sold: 1800,
    image: "/images/hero/erigga2.jpeg",
    category: "Concert",
  },
]

const mockEvents: Event[] = [
  {
    id: "EVT001",
    title: "Erigga Live Experience 2024",
    description: "The biggest concert of the year featuring Erigga and special guests",
    date: "2024-05-15",
    time: "8:00 PM",
    venue: "National Theatre, Iganmu Lagos",
    price: 10000,
    capacity: 5000,
    sold: 3200,
    image: "/images/hero/erigga1.jpeg",
    category: "Concert",
  },
  {
    id: "EVT002",
    title: "Street Dreams Tour",
    description: "Intimate acoustic session with Erigga",
    date: "2024-06-22",
    time: "6:00 PM",
    venue: "Freedom Park, Lagos Island",
    price: 7500,
    capacity: 1000,
    sold: 450,
    image: "/images/hero/erigga2.jpeg",
    category: "Acoustic",
  },
  {
    id: "EVT003",
    title: "Meet & Greet Session",
    description: "Exclusive fan meetup with photo opportunities",
    date: "2024-07-10",
    time: "4:00 PM",
    venue: "Silverbird Galleria, Victoria Island",
    price: 25000,
    capacity: 50,
    sold: 35,
    image: "/images/hero/erigga3.jpeg",
    category: "Meet & Greet",
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
    transition: {
      duration: 0.2,
    },
  },
}

export default function TicketsPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("my-tickets")
  const [tickets, setTickets] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const supabase = createClient()
  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase()
    return (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query) ||
      new Date(event.event_date).toLocaleDateString().includes(query)
    )
  })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white"
      case "used":
        return "bg-gray-500 text-white"
      case "expired":
        return "bg-red-500 text-white"
      default:
        return "bg-blue-500 text-white"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Shield className="w-3 h-3 mr-1" />
      case "used":
        return <QrCode className="w-3 h-3 mr-1" />
      case "expired":
        return <Clock className="w-3 h-3 mr-1" />
      default:
        return <Ticket className="w-3 h-3 mr-1" />
    }
  }

  useEffect(() => {
    if (user) {
      fetchTickets()
      fetchEvents()
    }
  }, [user])

  const fetchTickets = async () => {
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
            location,
            description
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          tickets!inner(count)
        `)
        .eq("status", "active")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })

      if (error) throw error

      const eventsWithSoldCount =
        data?.map((event) => ({
          ...event,
          sold: event.tickets?.length || 0,
          tickets_sold: event.tickets?.length || 0,
        })) || []

      setEvents(eventsWithSoldCount)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketPurchase = async (eventId: string, reference: string) => {
    setPurchaseLoading(eventId)
    try {
      // Redirect to survey page for this event
      window.location.href = `/events/survey?event=${eventId}`
    } catch (error) {
      console.error("Error initiating purchase:", error)
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error)
    setPurchaseLoading(null)
  }

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
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
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
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
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
              x: [-50, 50, -50],
              y: [-30, 30, -30],
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8 text-center">
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                Event Tickets
              </motion.h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Manage your tickets, discover upcoming events, and secure your spot at exclusive Erigga Live experiences
              </p>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-xl border-white/10 mb-8">
                  <TabsTrigger
                    value="my-tickets"
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Ticket className="w-4 h-4" />
                    My Tickets
                  </TabsTrigger>
                  <TabsTrigger
                    value="buy-tickets"
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Gift className="w-4 h-4" />
                    Buy Tickets
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  {/* My Tickets Tab */}
                  <TabsContent value="my-tickets" className="mt-0">
                    <motion.div
                      key="my-tickets"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {tickets.length === 0 ? (
                        <motion.div variants={itemVariants} className="text-center py-12">
                          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                            <CardContent className="p-8">
                              <Ticket className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h3>
                              <p className="text-gray-300 mb-6">
                                You haven't purchased any tickets yet. Check out upcoming events!
                              </p>
                              <Button
                                onClick={() => setActiveTab("buy-tickets")}
                                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                              >
                                Browse Events
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {tickets.map((ticket, index) => (
                            <motion.div key={ticket.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>
                                <CardHeader className="pb-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <CardTitle className="text-white text-lg mb-2">{ticket.events?.title}</CardTitle>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getStatusColor(ticket.status)}>
                                          {getStatusIcon(ticket.status)}
                                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                        </Badge>
                                        <Badge variant="outline" className="text-gray-300 border-gray-500">
                                          {ticket.ticket_type}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-white">
                                        {ticket.price_paid ? `₦${(ticket.price_paid / 100).toLocaleString()}` : "FREE"}
                                      </p>
                                      <p className="text-xs text-gray-400">#{ticket.ticket_number}</p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Calendar className="w-4 h-4 text-purple-400" />
                                      <span>{new Date(ticket.events?.event_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Clock className="w-4 h-4 text-blue-400" />
                                      <span>{ticket.events?.event_time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
                                      <MapPin className="w-4 h-4 text-orange-400" />
                                      <span className="truncate">
                                        {ticket.events?.venue}, {ticket.events?.location}
                                      </span>
                                    </div>
                                  </div>

                                  <TicketQRDisplay ticket={ticket} />

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
                                      onClick={() => {
                                        console.log("Show QR for ticket:", ticket.id)
                                      }}
                                    >
                                      <QrCode className="w-4 h-4 mr-2" />
                                      View QR
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent"
                                      onClick={() => {
                                        const ticketData = `
ERIGGA FAN PLATFORM - TICKET
${ticket.events?.title}
Venue: ${ticket.events?.venue}, ${ticket.events?.location}
Date: ${new Date(ticket.events?.event_date).toLocaleDateString()}
Time: ${ticket.events?.event_time}
Ticket #: ${ticket.ticket_number}
Status: ${ticket.status.toUpperCase()}
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
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>

                  {/* Buy Tickets Tab */}
                  <TabsContent value="buy-tickets" className="mt-0">
                    <motion.div
                      key="buy-tickets"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {/* Search Bar */}
                      <motion.div variants={itemVariants}>
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  placeholder="Search events by name, location, or date..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-white/10 text-gray-300 bg-transparent"
                              >
                                <Filter className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Events Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event, index) => (
                          <motion.div key={event.id} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                              <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Music className="w-12 h-12 text-white/60" />
                                </div>
                                <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                                  {event.category || "Concert"}
                                </Badge>
                                <div className="absolute bottom-3 left-3 right-3">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-white text-sm font-medium">
                                        {event.sold || 0}/{event.capacity} sold
                                      </span>
                                      <span className="text-white text-sm">
                                        {Math.round(((event.sold || 0) / event.capacity) * 100)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                                      <motion.div
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((event.sold || 0) / event.capacity) * 100}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <CardHeader className="pb-3">
                                <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                                <CardDescription className="text-gray-300">{event.description}</CardDescription>
                              </CardHeader>

                              <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Calendar className="w-4 h-4 text-purple-400" />
                                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span>{event.event_time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <MapPin className="w-4 h-4 text-orange-400" />
                                    <span className="truncate">
                                      {event.venue}, {event.location}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Users className="w-4 h-4 text-green-400" />
                                    <span>{event.capacity - (event.tickets_sold || 0)} spots left</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                  <div>
                                    <p className="text-2xl font-bold text-white">
                                      {event.price ? `₦${(event.price / 100).toLocaleString()}` : "FREE"}
                                    </p>
                                    <p className="text-xs text-gray-400">per ticket</p>
                                  </div>

                                  {(event.tickets_sold || 0) >= event.capacity ? (
                                    <Button disabled className="bg-gray-600">
                                      Sold Out
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => handleTicketPurchase(event.id, "")}
                                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                                      disabled={purchaseLoading === event.id}
                                    >
                                      {purchaseLoading === event.id ? (
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{
                                            duration: 1,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: "linear",
                                          }}
                                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                        />
                                      ) : (
                                        <Ticket className="w-4 h-4 mr-2" />
                                      )}
                                      {purchaseLoading === event.id ? "Processing..." : "Buy Ticket"}
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {filteredEvents.length === 0 && (
                        <motion.div variants={itemVariants} className="text-center py-12">
                          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                            <CardContent className="p-8">
                              <Search className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                              <p className="text-gray-300">
                                No events match your search criteria. Try adjusting your search terms.
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AuthGuard>
  )
}
