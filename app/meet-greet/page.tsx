"use client"

import { useState, useEffect } from "react"
import { Phone, Clock, Star, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import PaymentModal from "./components/PaymentModal"
import VideoCallInterface from "./components/VideoCallInterface"

export default function MeetGreetPage() {
  const { profile, isAuthenticated } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has a valid session from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const transactionRef = urlParams.get("transaction_reference")

    if (transactionRef) {
      verifyPaymentAndStartCall(transactionRef)
    }
  }, [])

  const verifyPaymentAndStartCall = async (transactionRef: string) => {
    try {
      const response = await fetch("/api/meet-greet/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_reference: transactionRef }),
      })

      const data = await response.json()
      if (data.success && data.session) {
        setSessionData(data.session)
        setShowVideoCall(true)
      }
    } catch (error) {
      console.error("Payment verification failed:", error)
    }
  }

  const handlePaymentSuccess = (sessionData: any) => {
    setShowPayment(false)
    setSessionData(sessionData)
    setShowVideoCall(true)
  }

  const handleCallEnd = () => {
    setShowVideoCall(false)
    setSessionData(null)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleBookCall = () => {
    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setIsAnimating(true)
    setTimeout(() => {
      setShowPayment(true)
      setIsAnimating(false)
    }, 500)
  }

  if (showVideoCall && sessionData) {
    return <VideoCallInterface sessionData={sessionData} onCallEnd={handleCallEnd} />
  }

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900"
          : "bg-gradient-to-b from-blue-100 via-white to-blue-50"
      }`}
    >
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-bounce opacity-50"></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="relative max-w-4xl w-full">
          {/* Superman Phone Booth */}
          <div
            className={`relative mx-auto transition-all duration-1000 ${
              isAnimating ? "scale-105 rotate-1" : "scale-100"
            }`}
          >
            {/* Booth Structure */}
            <div
              className={`relative w-80 h-96 mx-auto rounded-t-lg border-4 ${
                isDarkMode
                  ? "border-blue-400 bg-gradient-to-b from-blue-900/80 to-slate-900/90"
                  : "border-blue-600 bg-gradient-to-b from-blue-50/90 to-white/95"
              } backdrop-blur-sm shadow-2xl`}
            >
              {/* Glass Reflection Effect */}
              <div className="absolute inset-2 rounded-t-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

              {/* Booth Lighting */}
              <div
                className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-4 rounded-full ${
                  isDarkMode ? "bg-yellow-400" : "bg-yellow-300"
                } animate-pulse shadow-lg`}
              ></div>

              {/* Erigga's Avatar/Poster */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-blue-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-2xl">
                    ERIGGA
                  </div>
                </div>
              </div>

              {/* Superman Logo */}
              <div className="absolute top-44 left-1/2 transform -translate-x-1/2">
                <Shield className="w-8 h-8 text-red-500 animate-pulse" />
              </div>

              {/* Meet & Greet Info */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center px-4">
                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Meet & Greet
                </h3>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>20 minutes</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-green-500">₦100,000</span>
                </div>
              </div>

              {/* Book Call Button */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={handleBookCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
                  disabled={isAnimating}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {isAnimating ? "Connecting..." : "Book Call"}
                </Button>
              </div>
            </div>

            {/* Booth Base */}
            <div
              className={`w-84 h-8 mx-auto rounded-b-lg border-4 border-t-0 ${
                isDarkMode ? "border-blue-400 bg-slate-800" : "border-blue-600 bg-gray-200"
              }`}
            ></div>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card
              className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/80 border-gray-200"} backdrop-blur-sm`}
            >
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Instant Connection
                </h4>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Direct video call with Erigga in seconds
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/80 border-gray-200"} backdrop-blur-sm`}
            >
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  Exclusive Access
                </h4>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Personal 20-minute session with your favorite artist
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/80 border-gray-200"} backdrop-blur-sm`}
            >
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Secure Payment</h4>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Safe and secure payment via Paystack
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          isDarkMode={isDarkMode}
          userProfile={profile}
        />
      )}
    </div>
  )
}
