"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  Search,
  Filter,
  QrCode,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  Music,
  Crown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import QRCode from "qrcode"

interface TicketData {
  id: string
  ticket_number: string
  event_id: string
  status: "confirmed" | "pending" | "canceled" | "used" | "expired"
  created_at: string
  qr_code?: string
  events: {
    id: string
    title: string
    description: string
    event_date: string
    venue: string
    ticket_price: number
    max_attendees: number
    image_url?: string
  }
}

export default function TicketsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          events (
            id,
            title,
            description,
            event_date,
            venue,
            ticket_price,
            max_attendees,
            image_url
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Generate QR codes for tickets
      const ticketsWithQR = await Promise.all(
        (data || []).map(async (ticket) => {
          try {
            const qrData = JSON.stringify({
              ticketId: ticket.id,
              ticketNumber: ticket.ticket_number,
              eventId: ticket.event_id,
              userId: user?.id,
            })
            const qrCode = await QRCode.toDataURL(qrData)
            return { ...ticket, qr_code: qrCode }
          } catch (error) {
            console.error("Error generating QR code:", error)
            return ticket
          }
        }),
      )

      setTickets(ticketsWithQR)
    } catch (error) {
      console.error("Error loading tickets:", error)
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case "canceled":
      case "expired":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "used":
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "canceled":
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "used":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.events.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return matchesSearch && ticket.status === activeTab
  })

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

  if (loading) {
    return (
      <AuthGuard>
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
      </AuthGuard>
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
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <motion.h1
                    className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    My Tickets
                  </motion.h1>
                  <p className="text-gray-300 text-lg">Your event tickets and access passes</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      <Ticket className="w-4 h-4 mr-2" />
                      {tickets.length} Tickets
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Search and Filter */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-white/5 backdrop-blur-xl border-white/10">
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmed"
                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  >
                    Confirmed
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="used" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    Used
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                  >
                    Expired
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {/* Tickets Grid */}
            <AnimatePresence mode="wait">
              {filteredTickets.length > 0 ? (
                <motion.div
                  key="tickets"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      variants={itemVariants}
                      whileHover={cardHoverVariants.hover}
                      className="group"
                    >
                      <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                        {/* Ticket Header */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 overflow-hidden">
                          {/* Holographic Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{
                              x: [-100, 400],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "linear",
                            }}
                          />

                          {/* Event Image */}
                          {ticket.events.image_url && (
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-30"
                              style={{ backgroundImage: `url(${ticket.events.image_url})` }}
                            />
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getStatusColor(ticket.status)} border`}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">{ticket.status}</span>
                            </Badge>
                          </div>

                          {/* Ticket Number */}
                          <div className="absolute top-4 left-4">
                            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                              <p className="text-white text-sm font-mono">#{ticket.ticket_number}</p>
                            </div>
                          </div>

                          {/* Event Title */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white text-xl font-bold mb-1 line-clamp-2">{ticket.events.title}</h3>
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                              <Music className="w-4 h-4" />
                              <span>Live Event</span>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          {/* Event Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span className="text-sm">
                                {new Date(ticket.events.event_date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span className="text-sm">
                                {new Date(ticket.events.event_date).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPin className="w-4 h-4 text-green-400" />
                              <span className="text-sm">{ticket.events.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm">₦{ticket.events.ticket_price.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* QR Code */}
                          {ticket.qr_code && ticket.status === "confirmed" && (
                            <motion.div className="flex justify-center mb-4" whileHover={{ scale: 1.05 }}>
                              <div className="relative p-2 bg-white rounded-lg">
                                <img src={ticket.qr_code || "/placeholder.svg"} alt="QR Code" className="w-20 h-20" />
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg"
                                  animate={{
                                    opacity: [0, 0.5, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                              disabled={ticket.status !== "confirmed"}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              View QR
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Ticket Info */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>Purchased: {new Date(ticket.created_at).toLocaleDateString()}</span>
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Digital Ticket</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 max-w-md mx-auto">
                    <CardContent className="p-8">
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      >
                        <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
                      <p className="text-gray-400 mb-4">
                        {searchQuery || activeTab !== "all"
                          ? "No tickets match your current filters."
                          : "You haven't purchased any tickets yet."}
                      </p>
                      <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90">
                        Browse Events
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AuthGuard>
  )
}
