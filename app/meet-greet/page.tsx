"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Phone, Clock, Star, Shield, Zap, Calendar, Users, Video, Heart, Sun, Moon, Sparkles } from "lucide-react"
import { PaymentModal } from "./components/PaymentModal"
import { VideoCallInterface } from "./components/VideoCallInterface"
import { CountdownTimer } from "./components/CountdownTimer"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Session {
  id: string
  status: "pending" | "confirmed" | "active" | "completed"
  scheduledTime: Date
  roomUrl?: string
}

export default function MeetGreetPage() {
  const { isAuthenticated, profile } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Toggle theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const handleBookSession = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to book a session")
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsLoading(true)
    try {
      // Create session after successful payment
      const response = await fetch("/api/meet-greet/create-daily-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profile?.id,
          paymentReference: paymentData.reference,
        }),
      })

      if (response.ok) {
        const sessionData = await response.json()
        setCurrentSession({
          id: sessionData.sessionId,
          status: "confirmed",
          scheduledTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
          roomUrl: sessionData.roomUrl,
        })
        toast.success("Session booked successfully! You'll be notified when it's time.")
      } else {
        throw new Error("Failed to create session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error("Failed to create session. Please contact support.")
    } finally {
      setIsLoading(false)
      setShowPaymentModal(false)
    }
  }

  const handleSessionStart = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: "active",
      })
    }
  }

  const handleSessionEnd = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: "completed",
      })
      toast.success("Session completed! Thank you for joining.")
    }
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
          <Sun className="h-4 w-4 text-yellow-500" />
          <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-blue-600" />
          <Moon className="h-4 w-4 text-blue-400" />
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse ${
            isDarkMode ? "bg-blue-500" : "bg-blue-300"
          }`}
        />
        <div
          className={`absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse delay-1000 ${
            isDarkMode ? "bg-purple-500" : "bg-purple-300"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl animate-pulse delay-500 ${
            isDarkMode ? "bg-indigo-500" : "bg-indigo-300"
          }`}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-blue-500 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
            <Shield className="h-5 w-5" />
            SUPERMAN PHONE BOOTH
            <Sparkles className="h-5 w-5" />
          </div>
          <h1
            className={`text-6xl font-bold mb-4 ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            }`}
          >
            Meet & Greet with Erigga
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Step into the Superman Phone Booth for an exclusive 20-minute video call with Erigga. Transform your fan
            experience into something extraordinary!
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {currentSession?.status === "active" ? (
            <VideoCallInterface
              roomUrl={currentSession.roomUrl!}
              onSessionEnd={handleSessionEnd}
              sessionDuration={20 * 60 * 1000} // 20 minutes
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Phone Booth Visual */}
              <div className="relative">
                <Card
                  className={`overflow-hidden border-0 shadow-2xl ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-800/80 to-blue-900/80 backdrop-blur-xl"
                      : "bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl"
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Phone Booth Design */}
                    <div className="relative h-96 bg-gradient-to-b from-red-600 to-red-700 overflow-hidden">
                      {/* Glass Effect */}
                      <div className="absolute inset-4 bg-gradient-to-b from-blue-400/30 to-blue-600/30 rounded-lg backdrop-blur-sm border border-white/30">
                        {/* Interior Lighting */}
                        <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded opacity-80 animate-pulse" />

                        {/* Erigga Silhouette */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                          <div className="w-24 h-32 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-full opacity-70" />
                        </div>

                        {/* Superman Logo */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-red-600 font-bold text-2xl">S</span>
                          </div>
                        </div>

                        {/* Animated Sparkles */}
                        <div className="absolute top-4 right-4 animate-bounce">
                          <Sparkles className="h-6 w-6 text-yellow-300" />
                        </div>
                        <div className="absolute bottom-12 left-4 animate-bounce delay-500">
                          <Star className="h-4 w-4 text-blue-300" />
                        </div>
                        <div className="absolute top-12 left-8 animate-bounce delay-1000">
                          <Zap className="h-5 w-5 text-yellow-400" />
                        </div>
                      </div>

                      {/* Phone Booth Frame */}
                      <div className="absolute inset-0 border-8 border-red-800 rounded-lg" />
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-red-900 rounded-b-lg" />
                    </div>

                    {/* Status Display */}
                    <div className="p-6">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <div
                          className={`w-3 h-3 rounded-full animate-pulse ${
                            currentSession ? "bg-green-500" : "bg-blue-500"
                          }`}
                        />
                        <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {currentSession ? "Session Confirmed" : "Ready for Transformation"}
                        </span>
                      </div>

                      {currentSession && (
                        <CountdownTimer targetTime={currentSession.scheduledTime} onComplete={handleSessionStart} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Information */}
              <div className="space-y-6">
                <Card
                  className={`border-0 shadow-xl ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl"
                      : "bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-xl"
                  }`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-2xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      <Phone className="h-6 w-6 text-blue-500" />
                      Exclusive Meet & Greet
                    </CardTitle>
                    <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      Your chance to connect directly with Erigga in a private video session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                      <div className="text-4xl font-bold text-blue-500 mb-2">₦25,000</div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        20-minute exclusive session
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-green-500" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>High-quality video call</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          20 minutes of exclusive time
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          Private one-on-one session
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          Personal interaction & photos
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Flexible scheduling</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Booking Button */}
                    <Button
                      onClick={handleBookSession}
                      disabled={isLoading || !!currentSession}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : currentSession ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Session Booked
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Enter the Phone Booth
                        </div>
                      )}
                    </Button>

                    {!isAuthenticated && (
                      <p className={`text-sm text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Please{" "}
                        <a href="/login" className="text-blue-500 hover:underline">
                          sign in
                        </a>{" "}
                        to book your session
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Session Guidelines */}
                <Card
                  className={`border-0 shadow-xl ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-800/80 to-green-900/80 backdrop-blur-xl"
                      : "bg-gradient-to-br from-white/80 to-green-50/80 backdrop-blur-xl"
                  }`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-lg flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      <Shield className="h-5 w-5 text-green-500" />
                      Session Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      • Be respectful and professional during the call
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      • Have a stable internet connection
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      • Sessions are recorded for quality purposes
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      • No refunds for missed sessions
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      • Screenshots allowed, screen recording prohibited
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          amount={25000}
          userEmail={profile?.email || ""}
        />
      )}
    </div>
  )
}
