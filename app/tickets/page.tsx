"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket, Gift, Calendar } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { TicketCard } from "@/components/tickets/ticket-card"
import { TicketPurchase } from "@/components/tickets/ticket-purchase"
import type { Event, Ticket as TicketType } from "@/lib/types/ticketing"

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

export default function TicketsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("my-tickets")
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets/user")
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
      } else {
        console.error("Failed to fetch tickets:", data.error)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const fetchCurrentEvent = async () => {
    try {
      const response = await fetch("/api/events/current")
      const data = await response.json()

      if (data.success && data.event) {
        setCurrentEvent(data.event)
      }
    } catch (error) {
      console.error("Error fetching current event:", error)
    }
  }

  const handlePurchaseSuccess = (ticket: any) => {
    // Refresh tickets list
    fetchTickets()
    // Switch to my tickets tab
    setActiveTab("my-tickets")
    // Show success message
    toast({
      title: "Ticket Purchased!",
      description: "Your ticket has been added to your collection.",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTickets(), fetchCurrentEvent()])
      setLoading(false)
    }

    if (user) {
      loadData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
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

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      >
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
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8 text-center">
              <motion.h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
                Event Tickets
              </motion.h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Manage your tickets and secure your spot at exclusive Erigga Live experiences
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
                    My Tickets ({tickets.length})
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
                                You haven't purchased any tickets yet. Check out the current event!
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {tickets.map((ticket, index) => (
                            <motion.div key={ticket.id} variants={itemVariants}>
                              <TicketCard ticket={ticket as any} />
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
                      {currentEvent ? (
                        <motion.div variants={itemVariants}>
                          <TicketPurchase
                            event={currentEvent}
                            userEmail={profile?.email}
                            userCoins={profile?.coins || 0}
                            onPurchaseSuccess={handlePurchaseSuccess}
                          />
                        </motion.div>
                      ) : (
                        <motion.div variants={itemVariants} className="text-center py-12">
                          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                            <CardContent className="p-8">
                              <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">No Current Event</h3>
                              <p className="text-gray-300">
                                There are no events available for purchase at the moment. Check back soon!
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
