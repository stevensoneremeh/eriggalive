"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, QrCode, Download, Sparkles, Music, Gift, Zap, Shield, Star } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { ticketingService } from "@/lib/services/ticketing"
import { paymentService } from "@/lib/services/payment"
import type { Event } from "@/lib/types/ticketing"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TicketQRCode } from "./TicketQRCode" // Import TicketQRCode component

export default function TicketsPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("my-tickets")
  const [tickets, setTickets] = useState<any[]>([])
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [userWallet, setUserWallet] = useState<{ balance_coins: number } | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"paystack" | "coin">("paystack")
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchUserTickets()
      fetchCurrentEvent()
      fetchUserWallet()
    }
  }, [user])

  const fetchUserTickets = async () => {
    try {
      const { data: userTickets, error } = await supabase
        .from("tickets")
        .select(`
          *,
          event:events_v2(*),
          payment:payments(*)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTickets(userTickets || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const fetchCurrentEvent = async () => {
    try {
      const event = await ticketingService.getCurrentEvent()
      setCurrentEvent(event)
    } catch (error) {
      console.error("Error fetching current event:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserWallet = async () => {
    try {
      if (!user?.id) return
      const wallet = await ticketingService.getUserWallet(user.id)
      setUserWallet(wallet)
    } catch (error) {
      console.error("Error fetching wallet:", error)
    }
  }

  const handleTicketPurchase = async () => {
    if (!currentEvent || !user) return

    setPurchaseLoading(true)
    try {
      if (selectedPaymentMethod === "paystack") {
        // Initialize Paystack payment
        const response = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: "ticket",
            context_id: currentEvent.id,
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        // Redirect to Paystack
        window.location.href = data.authorization_url
      } else {
        // Process coin payment
        const result = await paymentService.processCoinPayment(
          user.id,
          "ticket",
          currentEvent.ticket_price_ngn,
          currentEvent.id,
          {
            event_title: currentEvent.title,
            event_id: currentEvent.id,
          },
        )

        if (!result.success) {
          throw new Error(result.error)
        }

        // Create ticket immediately for coin payments
        if (result.payment) {
          await ticketingService.createTicket(currentEvent.id, user.id, result.payment.id)
          await fetchUserTickets()
          await fetchUserWallet()
          alert("Ticket purchased successfully with coins!")
        }
      }
    } catch (error) {
      console.error("Purchase error:", error)
      alert(error instanceof Error ? error.message : "Purchase failed")
    } finally {
      setPurchaseLoading(false)
    }
  }

  const formatPrice = (priceInNGN: number) => {
    if (priceInNGN === 0) return "FREE"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(priceInNGN)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unused":
        return <Sparkles className="w-4 h-4" />
      case "admitted":
        return <Star className="w-4 h-4" />
      case "refunded":
        return <Clock className="w-4 h-4" />
      case "invalid":
        return <Zap className="w-4 h-4" />
      default:
        return <Gift className="w-4 h-4" />
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 },
    },
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
              <motion.h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
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
                    <Gift className="w-4 h-4" />
                    My Tickets
                  </TabsTrigger>
                  <TabsTrigger
                    value="buy-tickets"
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Music className="w-4 h-4" />
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
                              <Gift className="w-16 h-16 text-purple-400 mx-auto mb-4" />
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
                                      <CardTitle className="text-white text-lg mb-2">{ticket.event?.title}</CardTitle>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getStatusColor(ticket.status)}>
                                          {getStatusIcon(ticket.status)}
                                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-white">
                                        {formatPrice(ticket.payment?.amount_ngn || 0)}
                                      </p>
                                      <p className="text-xs text-gray-400">#{ticket.id.slice(0, 8)}</p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Calendar className="w-4 h-4 text-purple-400" />
                                      <span>{formatDate(ticket.event?.starts_at || "")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
                                      <MapPin className="w-4 h-4 text-orange-400" />
                                      <span className="truncate">{ticket.event?.venue}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
                                        >
                                          <QrCode className="w-4 h-4 mr-2" />
                                          View QR
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20">
                                        <DialogHeader>
                                          <DialogTitle className="text-white">Ticket QR Code</DialogTitle>
                                        </DialogHeader>
                                        <TicketQRCode ticket={ticket} />
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent"
                                      onClick={() => downloadTicket(ticket)}
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

                  {/* Buy Tickets Tab - Show only current event */}
                  <TabsContent value="buy-tickets" className="mt-0">
                    <motion.div
                      key="buy-tickets"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {!currentEvent ? (
                        <motion.div variants={itemVariants} className="text-center py-12">
                          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                            <CardContent className="p-8">
                              <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">No Active Events</h3>
                              <p className="text-gray-300">
                                There are no active events available for purchase at the moment. Check back soon!
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
                          <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
                            <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                              {currentEvent.cover_image_url ? (
                                <img
                                  src={currentEvent.cover_image_url || "/placeholder.svg"}
                                  alt={currentEvent.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Music className="w-16 h-16 text-white/60" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4">
                                <h2 className="text-2xl font-bold text-white mb-2">{currentEvent.title}</h2>
                                <p className="text-gray-200">{currentEvent.description}</p>
                              </div>
                            </div>

                            <CardContent className="p-6 space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                  <Calendar className="w-5 h-5 text-purple-400" />
                                  <span>{formatDate(currentEvent.starts_at)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                  <MapPin className="w-5 h-5 text-orange-400" />
                                  <span>{currentEvent.venue}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-3xl font-bold text-white">
                                    {formatPrice(currentEvent.ticket_price_ngn)}
                                  </p>
                                  <p className="text-sm text-gray-400">per ticket</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-white">
                                    {currentEvent.capacity - (currentEvent.sold || 0)} left
                                  </p>
                                  <p className="text-sm text-gray-400">of {currentEvent.capacity}</p>
                                </div>
                              </div>

                              {/* Payment Method Selection */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">Payment Method</h3>
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    variant={selectedPaymentMethod === "paystack" ? "default" : "outline"}
                                    onClick={() => setSelectedPaymentMethod("paystack")}
                                    className={
                                      selectedPaymentMethod === "paystack"
                                        ? "bg-purple-500 hover:bg-purple-600"
                                        : "border-white/20 text-gray-300 hover:bg-white/10"
                                    }
                                  >
                                    <Music className="w-4 h-4 mr-2" />
                                    Paystack
                                  </Button>
                                  <Button
                                    variant={selectedPaymentMethod === "coin" ? "default" : "outline"}
                                    onClick={() => setSelectedPaymentMethod("coin")}
                                    disabled={!userWallet || userWallet.balance_coins < currentEvent.ticket_price_ngn}
                                    className={
                                      selectedPaymentMethod === "coin"
                                        ? "bg-purple-500 hover:bg-purple-600"
                                        : "border-white/20 text-gray-300 hover:bg-white/10"
                                    }
                                  >
                                    <Gift className="w-4 h-4 mr-2" />
                                    Coins ({userWallet?.balance_coins || 0})
                                  </Button>
                                </div>
                                {selectedPaymentMethod === "coin" &&
                                  userWallet &&
                                  userWallet.balance_coins < currentEvent.ticket_price_ngn && (
                                    <p className="text-sm text-red-400">
                                      Insufficient coins. You need {currentEvent.ticket_price_ngn} coins but have{" "}
                                      {userWallet.balance_coins}.
                                    </p>
                                  )}
                              </div>

                              <Button
                                onClick={handleTicketPurchase}
                                disabled={
                                  purchaseLoading ||
                                  (selectedPaymentMethod === "coin" &&
                                    (!userWallet || userWallet.balance_coins < currentEvent.ticket_price_ngn))
                                }
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-lg py-3"
                              >
                                {purchaseLoading ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                ) : (
                                  <Gift className="w-5 h-5 mr-2" />
                                )}
                                {purchaseLoading
                                  ? "Processing..."
                                  : `Buy Ticket - ${formatPrice(currentEvent.ticket_price_ngn)}`}
                              </Button>
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

  function downloadTicket(ticket: any) {
    const ticketData = `
ERIGGA FAN PLATFORM - EXCLUSIVE TICKET
${ticket.event?.title}
Venue: ${ticket.event?.venue}
Date: ${formatDate(ticket.event?.starts_at || "")}
Ticket ID: ${ticket.id}
Status: ${ticket.status.toUpperCase()}
QR Code: ${ticket.qr_token_hash}
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `erigga-ticket-${ticket.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
}
