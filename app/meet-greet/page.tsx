"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Video,
  Phone,
  Zap,
  Shield,
  Crown,
  Users,
  CheckCircle,
  Loader2,
  VideoIcon,
  Gift,
  Sparkles,
} from "lucide-react"
import { PaymentModal } from "./components/PaymentModal"
import { VideoCallInterface } from "./components/VideoCallInterface"
import { CountdownTimer } from "./components/CountdownTimer"
import { toast } from "sonner"
import Link from "next/link"

interface Session {
  id: string
  user_id: string
  session_type: "meet_greet" | "video_call" | "phone_call"
  duration_minutes: number
  price_amount: number
  scheduled_at: string
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  payment_status: "pending" | "completed" | "failed"
  daily_room_url?: string
  created_at: string
}

const SESSION_TYPES = [
  {
    id: "video_call",
    name: "Video Meet & Greet",
    description: "Face-to-face video call with Erigga",
    duration: 20,
    price: 50000, // ₦500
    icon: Video,
    color: "from-blue-500 to-blue-600",
    features: ["HD Video Call", "20 Minutes", "Personal Interaction", "Recording Available"],
  },
  {
    id: "phone_call",
    name: "Phone Meet & Greet",
    description: "Personal phone conversation",
    duration: 15,
    price: 30000, // ₦300
    icon: Phone,
    color: "from-green-500 to-green-600",
    features: ["Voice Call", "15 Minutes", "Personal Chat", "Exclusive Access"],
  },
  {
    id: "meet_greet",
    name: "Premium Meet & Greet",
    description: "Extended video session with exclusive content",
    duration: 30,
    price: 100000, // ₦1000
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    features: ["Extended Session", "30 Minutes", "Exclusive Content", "Priority Support", "Recording Included"],
  },
]

export default function MeetGreetPage() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const [selectedSession, setSelectedSession] = useState<(typeof SESSION_TYPES)[0] | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeSession, setActiveSession] = useState<Session | null>(null)

  useEffect(() => {
    if (isAuthenticated && profile) {
      loadUserSessions()
    }
  }, [isAuthenticated, profile])

  const loadUserSessions = async () => {
    setLoadingSessions(true)
    try {
      // Mock data for sessions
      const mockSessions: Session[] = [
        {
          id: "1",
          user_id: profile?.id || "",
          session_type: "video_call",
          duration_minutes: 20,
          price_amount: 50000,
          scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: "confirmed",
          payment_status: "completed",
          daily_room_url: "https://erigga.daily.co/meet-greet-1",
          created_at: new Date().toISOString(),
        },
      ]
      setUserSessions(mockSessions)
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast.error("Failed to load sessions")
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleBookSession = (sessionType: (typeof SESSION_TYPES)[0]) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to book a session")
      return
    }

    setSelectedSession(sessionType)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (sessionData: any) => {
    setShowPaymentModal(false)
    toast.success("Session booked successfully!")
    loadUserSessions()
  }

  const handleJoinSession = (session: Session) => {
    if (session.status !== "confirmed") {
      toast.error("Session is not ready yet")
      return
    }

    setActiveSession(session)
    setShowVideoCall(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "in_progress":
        return "bg-blue-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "pending":
        return "Pending"
      case "in_progress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-blue-900 to-red-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading Meet & Greet...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-blue-900 to-red-900 relative overflow-hidden">
      {/* Superman Theme Background Effects */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100&text=S')] opacity-5 bg-repeat"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-900/20 to-red-900/40"></div>

      {/* Phone Booth Silhouette */}
      <div className="absolute right-10 top-20 w-32 h-96 bg-gradient-to-b from-red-600/30 to-red-800/30 rounded-t-3xl border-4 border-red-500/50 hidden lg:block">
        <div className="w-full h-8 bg-red-500/40 rounded-t-2xl mb-4"></div>
        <div className="mx-4 space-y-2">
          <div className="h-2 bg-yellow-400/60 rounded"></div>
          <div className="h-2 bg-yellow-400/40 rounded"></div>
          <div className="h-2 bg-yellow-400/30 rounded"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-blue-500 text-white px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Zap className="h-4 w-4" />
            Superman Phone Booth Experience
            <Shield className="h-4 w-4" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-2xl">
            Meet & Greet with{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">Erigga</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Step into the Superman phone booth and connect with Erigga like never before. Choose your heroic encounter
            and experience the power of personal connection.
          </p>
        </div>

        <Tabs defaultValue="book" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10 backdrop-blur-sm">
            <TabsTrigger
              value="book"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Session
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Users className="h-4 w-4 mr-2" />
              My Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="space-y-8">
            {/* Session Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SESSION_TYPES.map((sessionType) => {
                const Icon = sessionType.icon
                return (
                  <Card
                    key={sessionType.id}
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                    onClick={() => handleBookSession(sessionType)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-r ${sessionType.color} shadow-lg group-hover:shadow-xl transition-shadow`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl">{sessionType.name}</CardTitle>
                      <p className="text-blue-100 text-sm">{sessionType.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400 mb-1">
                          ₦{(sessionType.price / 100).toLocaleString()}
                        </div>
                        <div className="text-blue-200 text-sm">{sessionType.duration} minutes</div>
                      </div>

                      <div className="space-y-2">
                        {sessionType.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-blue-100">
                            <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full bg-gradient-to-r ${sessionType.color} hover:opacity-90 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookSession(sessionType)
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* How It Works */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl text-center">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-red-500 to-blue-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Choose Your Power</h3>
                    <p className="text-blue-100 text-sm">Select your preferred session type and duration</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
                    <p className="text-blue-100 text-sm">Complete your booking with secure payment</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Get Confirmation</h3>
                    <p className="text-blue-100 text-sm">Receive your session details and join link</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">4</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Meet Your Hero</h3>
                    <p className="text-blue-100 text-sm">Join your session and enjoy the experience</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {!isAuthenticated ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Shield className="h-16 w-16 text-white mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">Sign In Required</h3>
                  <p className="text-blue-100 mb-6">Please sign in to view your Meet & Greet sessions.</p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : loadingSessions ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-12 w-12 text-white mx-auto mb-4 animate-spin" />
                  <p className="text-blue-100">Loading your sessions...</p>
                </CardContent>
              </Card>
            ) : userSessions.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-white mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Sessions Yet</h3>
                  <p className="text-blue-100 mb-6">You haven't booked any Meet & Greet sessions yet.</p>
                  <Button
                    onClick={() => document.querySelector('[value="book"]')?.click()}
                    className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Book Your First Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userSessions.map((session) => {
                  const sessionType = SESSION_TYPES.find((type) => type.id === session.session_type)
                  const Icon = sessionType?.icon || Video
                  const isUpcoming = new Date(session.scheduled_at) > new Date()
                  const canJoin = session.status === "confirmed" && isUpcoming

                  return (
                    <Card key={session.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-3 rounded-full bg-gradient-to-r ${sessionType?.color || "from-gray-500 to-gray-600"}`}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-lg">
                                {sessionType?.name || "Meet & Greet"}
                              </h3>
                              <p className="text-blue-200 text-sm">
                                {new Date(session.scheduled_at).toLocaleDateString()} at{" "}
                                {new Date(session.scheduled_at).toLocaleTimeString()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${getStatusColor(session.status)} text-white border-0`}>
                                  {getStatusText(session.status)}
                                </Badge>
                                <span className="text-blue-200 text-sm">{session.duration_minutes} minutes</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {isUpcoming && <CountdownTimer targetDate={session.scheduled_at} />}
                            {canJoin && (
                              <Button
                                onClick={() => handleJoinSession(session)}
                                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                              >
                                <VideoIcon className="h-4 w-4 mr-2" />
                                Join Session
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSession && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          sessionType={selectedSession}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Video Call Interface */}
      {showVideoCall && activeSession && (
        <VideoCallInterface isOpen={showVideoCall} onClose={() => setShowVideoCall(false)} session={activeSession} />
      )}
    </div>
  )
}
