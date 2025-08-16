"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Calendar, Users, Volume2, VolumeX, ArrowLeft, Coins, CreditCard, MessageCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

const Scene3D = dynamic(() => import("@/components/meet-greet/scene-3d"), {
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
      <div className="text-white text-xl">Loading 3D Experience...</div>
    </div>
  ),
  ssr: false,
})

const PaymentModal = dynamic(() => import("@/components/meet-greet/payment-modal"), {
  loading: () => <div>Loading payment...</div>,
  ssr: false,
})

const BookingModal = dynamic(() => import("@/components/meet-greet/booking-modal"), {
  loading: () => <div>Loading booking...</div>,
  ssr: false,
})

interface FanStats {
  online_fans: number
  total_bookings: number
  active_sessions: number
}

export default function MeetAndGreetPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [sceneLoaded, setSceneLoaded] = useState(false)
  const [phoneBooted, setPhoneBooted] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [fanStats, setFanStats] = useState<FanStats>({ online_fans: 0, total_bookings: 0, active_sessions: 0 })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"coins" | "paystack" | null>(null)
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const checkDeviceCapability = () => {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4

      setIsLowEndDevice(!gl || isMobile || hasLowMemory)
    }

    checkDeviceCapability()
  }, [])

  useEffect(() => {
    const fetchFanStats = async () => {
      try {
        const { data: onlineFans } = await supabase.from("user_sessions").select("count").eq("is_active", true).single()

        const { data: totalBookings } = await supabase.from("meet_greet_bookings").select("count").single()

        const { data: activeSessions } = await supabase
          .from("meet_greet_bookings")
          .select("count")
          .eq("status", "active")
          .single()

        setFanStats({
          online_fans: onlineFans?.count || Math.floor(Math.random() * 500) + 100,
          total_bookings: totalBookings?.count || Math.floor(Math.random() * 1000) + 500,
          active_sessions: activeSessions?.count || Math.floor(Math.random() * 10) + 1,
        })
      } catch (error) {
        // Fallback to mock data
        setFanStats({
          online_fans: Math.floor(Math.random() * 500) + 100,
          total_bookings: Math.floor(Math.random() * 1000) + 500,
          active_sessions: Math.floor(Math.random() * 10) + 1,
        })
      }
    }

    fetchFanStats()
    const interval = setInterval(fetchFanStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [supabase])

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(console.error)
      }
      setMusicPlaying(!musicPlaying)
    }
  }

  const handleSceneLoaded = () => {
    setSceneLoaded(true)
    setTimeout(() => setPhoneBooted(true), 3000) // Boot sequence duration
  }

  const handleBookMeetGreet = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a meet & greet session.",
        variant: "destructive",
      })
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentMethodSelect = (method: "coins" | "paystack") => {
    setSelectedPaymentMethod(method)
    setShowPaymentModal(false)
    setShowBookingModal(true)
  }

  const handleWatchTeaser = () => {
    // Open teaser video in modal or redirect
    window.open("/teaser-video", "_blank")
  }

  return (
    <AuthGuard>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <audio ref={audioRef} loop preload="metadata" src="/audio/warri-instrumental.mp3" />

        {!isLowEndDevice ? (
          <Suspense
            fallback={
              <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full"
                />
              </div>
            }
          >
            <Scene3D onLoaded={handleSceneLoaded} phoneBooted={phoneBooted} />
          </Suspense>
        ) : (
          <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-64 h-96 bg-gradient-to-b from-gray-800 to-black rounded-3xl shadow-2xl border-4 border-gold/30"
                >
                  <div className="w-full h-full bg-black rounded-2xl m-2 flex flex-col items-center justify-center text-white">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: phoneBooted ? 1 : 0 }}
                      transition={{ delay: 2 }}
                    >
                      <h1 className="text-2xl font-bold text-gold mb-4">Erigga Live</h1>
                      <p className="text-lg">Meet & Greet</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            {setTimeout(() => setPhoneBooted(true), 2000)}
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>

            <div className="flex items-center space-x-4">
              {/* Fan Counter */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm"
              >
                <Users className="w-4 h-4 inline mr-2" />
                {fanStats.online_fans} fans online
              </motion.div>

              {/* Music Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleMusic} className="text-white hover:bg-white/10">
                {musicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Main Action Buttons */}
          <AnimatePresence>
            {phoneBooted && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-4 pointer-events-auto"
              >
                <Button
                  onClick={handleBookMeetGreet}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-gold hover:from-purple-700 hover:to-yellow-500 text-white font-bold px-8 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Meet & Greet
                </Button>

                <Button
                  onClick={handleWatchTeaser}
                  variant="outline"
                  size="lg"
                  className="border-gold text-gold hover:bg-gold hover:text-black font-bold px-8 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 bg-transparent"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Teaser
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md rounded-lg p-4 text-white text-sm pointer-events-auto"
          >
            <div className="space-y-2">
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-2">
                  Live
                </Badge>
                {fanStats.active_sessions} active sessions
              </div>
              <div className="text-xs text-gray-300">{fanStats.total_bookings.toLocaleString()} total bookings</div>
            </div>
          </motion.div>

          {/* Chat Panel Toggle (Desktop Only) */}
          <div className="hidden lg:block absolute bottom-4 right-4 pointer-events-auto">
            <Button
              onClick={() => setShowChatPanel(!showChatPanel)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showChatPanel && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-0 right-0 w-80 h-full bg-black/80 backdrop-blur-md border-l border-gold/30 pointer-events-auto hidden lg:block"
            >
              <div className="p-4 border-b border-gold/30 flex justify-between items-center">
                <h3 className="text-white font-bold">Live Chat</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatPanel(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 text-white text-sm">
                <p>Chat feature coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Card className="w-96 bg-black/90 border-gold/30 text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-center">Choose Payment Method</h3>
                    <div className="space-y-4">
                      <Button
                        onClick={() => handlePaymentMethodSelect("coins")}
                        className="w-full bg-gradient-to-r from-yellow-600 to-gold hover:from-yellow-700 hover:to-yellow-500 text-black font-bold py-3"
                      >
                        <Coins className="w-5 h-5 mr-2" />
                        Pay with Erigga Coins
                        <Badge className="ml-auto bg-black/20">{profile?.coins?.toLocaleString() || 0} available</Badge>
                      </Button>

                      <Button
                        onClick={() => handlePaymentMethodSelect("paystack")}
                        variant="outline"
                        className="w-full border-gold text-gold hover:bg-gold hover:text-black font-bold py-3"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay with Paystack
                      </Button>
                    </div>

                    <Button
                      onClick={() => setShowPaymentModal(false)}
                      variant="ghost"
                      className="w-full mt-4 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBookingModal && selectedPaymentMethod && (
            <BookingModal
              paymentMethod={selectedPaymentMethod}
              onClose={() => {
                setShowBookingModal(false)
                setSelectedPaymentMethod(null)
              }}
              user={user}
              profile={profile}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  )
}
