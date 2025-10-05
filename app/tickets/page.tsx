"use client"
<<<<<<< HEAD
import { AuthGuard } from "@/components/auth-guard"
import { TicketsClient } from "./tickets-client"

// Mock events data
const events = [
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
  {
    id: "3",
    title: "Abuja Street Vibes",
    description: "Intimate acoustic session with Q&A and meet & greet",
    venue: "Transcorp Hilton",
    location: "Abuja, FCT",
    date: "2025-02-20T18:00:00Z",
    price: 750000, // 7500 NGN in kobo
    maxTickets: 500,
    ticketsSold: 450,
    image: "/placeholder.svg?height=300&width=400",
    category: "Acoustic",
    isVip: false,
  },
]

// Mock user tickets
const userTickets = [
  {
    id: "ticket-001",
    eventId: "1",
    eventTitle: "Warri Live Show 2024",
    venue: "Warri City Stadium",
    date: "2024-12-25T20:00:00Z",
    ticketNumber: "WLS-2024-001523",
    qrCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPgogIDxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwMCI+UVIgQ29kZTwvdGV4dD4KPC9zdmc+",
    status: "confirmed",
    purchasedAt: "2024-11-15T10:30:00Z",
  },
]

// Mock past events
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

export default function TicketsPage() {
  return (
    <AuthGuard>
      <TicketsClient />
=======

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
  CreditCard,
  CoinsIcon,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { TicketQRDisplay } from "@/components/tickets/ticket-qr-display"
import { toast } from "sonner"

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

export default function TicketsPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("my-tickets")
  const [tickets, setTickets] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "coins">("paystack")
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

  const handleTicketPurchase = async (eventId: string, paymentType: "paystack" | "coins") => {
    setPurchaseLoading(eventId)

    try {
      const event = events.find((e) => e.id === eventId)
      if (!event) throw new Error("Event not found")

      if (paymentType === "coins") {
        // Check if user has enough coins
        if (!profile?.coins || profile.coins < event.price / 100) {
          toast.error("Insufficient Erigga Coins")
          setPurchaseLoading(null)
          return
        }

        // Process coin payment
        const { data, error } = await supabase.rpc("purchase_ticket_with_coins", {
          p_event_id: eventId,
          p_user_id: user?.id,
          p_coin_amount: event.price / 100,
        })

        if (error) throw error

        toast.success("Ticket purchased with Erigga Coins!")
        fetchTickets()
      } else {
        // Paystack payment
        const { data, error } = await supabase
          .from("payment_intents")
          .insert({
            user_id: user?.id,
            event_id: eventId,
            amount: event.price,
            currency: "NGN",
            payment_method: "paystack",
            status: "pending",
          })
          .select()
          .single()

        if (error) throw error

        // Initialize Paystack payment
        const paystackHandler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user?.email,
          amount: event.price,
          currency: "NGN",
          ref: data.id,
          metadata: {
            event_id: eventId,
            user_id: user?.id,
            payment_intent_id: data.id,
          },
          callback: async (response: any) => {
            // Verify payment and create ticket
            const { error: verifyError } = await supabase.rpc("verify_paystack_payment", {
              p_reference: response.reference,
              p_payment_intent_id: data.id,
            })

            if (verifyError) {
              toast.error("Payment verification failed")
            } else {
              toast.success("Ticket purchased successfully!")
              fetchTickets()
            }
          },
          onClose: () => {
            toast.info("Payment cancelled")
          },
        })

        paystackHandler.openIframe()
      }
    } catch (error) {
      console.error("Error purchasing ticket:", error)
      toast.error("Failed to purchase ticket")
    } finally {
      setPurchaseLoading(null)
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
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
                Event Tickets
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Manage your tickets, discover upcoming events, and secure your spot at exclusive Erigga Live experiences
              </p>
            </motion.div>

            {/* Tabs */}
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {tickets.length === 0 ? (
                      <div className="text-center py-12">
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
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {tickets.map((ticket, index) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                          >
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Search Bar */}
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

                    {/* Events Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
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
                                  {event.title?.toLowerCase().includes("intimate") ? (
                                    <div>
                                      <p className="text-lg text-gray-400 line-through">₦50,000</p>
                                      <p className="text-2xl font-bold text-green-400">₦20,000</p>
                                    </div>
                                  ) : (
                                    <p className="text-2xl font-bold text-white">
                                      {event.price ? `₦${(event.price / 100).toLocaleString()}` : "FREE"}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400">per ticket</p>
                                </div>

                                {(event.tickets_sold || 0) >= event.capacity ? (
                                  <Button disabled className="bg-gray-600">
                                    Sold Out
                                  </Button>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleTicketPurchase(event.id, "paystack")}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                                        disabled={purchaseLoading === event.id}
                                      >
                                        <CreditCard className="w-4 h-4 mr-1" />
                                        Paystack
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleTicketPurchase(event.id, "coins")}
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90"
                                        disabled={
                                          purchaseLoading === event.id ||
                                          !profile?.coins ||
                                          profile.coins < event.price / 100
                                        }
                                      >
                                        <CoinsIcon className="w-4 h-4 mr-1" />
                                        Coins
                                      </Button>
                                    </div>
                                    {profile?.coins && profile.coins < event.price / 100 && (
                                      <p className="text-xs text-red-400">Insufficient coins</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {filteredEvents.length === 0 && (
                      <div className="text-center py-12">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                          <CardContent className="p-8">
                            <Search className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                            <p className="text-gray-300">
                              No events match your search criteria. Try adjusting your search terms.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </motion.div>
>>>>>>> new
    </AuthGuard>
  )
}
