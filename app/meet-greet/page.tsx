"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PaymentModal } from "./components/PaymentModal"
import { VideoCallInterface } from "./components/VideoCallInterface"
import { Phone, Video, Clock, Star, Sun, Moon, Zap } from "lucide-react"

export default function MeetGreetPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Add pulsing animation to the booth
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    setShowPaymentModal(false)
    // Auto-start session after payment
    setTimeout(() => {
      setSessionActive(true)
    }, 2000)
  }

  const handleSessionEnd = () => {
    setSessionActive(false)
    setPaymentSuccess(false)
  }

  if (sessionActive) {
    return (
      <VideoCallInterface
        onSessionEnd={handleSessionEnd}
        sessionDuration={20 * 60} // 20 minutes in seconds
      />
    )
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full p-2">
          <Sun className="h-4 w-4 text-yellow-400" />
          <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-blue-600" />
          <Moon className="h-4 w-4 text-blue-300" />
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-20 left-10 w-2 h-2 rounded-full animate-pulse ${
            isDarkMode ? "bg-blue-400" : "bg-blue-600"
          }`}
        />
        <div
          className={`absolute top-40 right-20 w-1 h-1 rounded-full animate-ping ${
            isDarkMode ? "bg-cyan-400" : "bg-cyan-600"
          }`}
        />
        <div
          className={`absolute bottom-32 left-1/4 w-3 h-3 rounded-full animate-bounce ${
            isDarkMode ? "bg-purple-400" : "bg-purple-600"
          }`}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${isDarkMode ? "bg-blue-600/20" : "bg-blue-100"}`}>
              <Phone className={`h-8 w-8 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <h1 className={`text-4xl md:text-6xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
              Meet & Greet
            </h1>
            <div className={`p-3 rounded-full ${isDarkMode ? "bg-blue-600/20" : "bg-blue-100"}`}>
              <Video className={`h-8 w-8 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
          </div>
          <p className={`text-xl ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Step into the booth for an exclusive 20-minute video call with Erigga
          </p>
        </div>

        {/* Superman Phone Booth */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            {/* Booth Structure */}
            <div
              className={`relative w-80 h-96 mx-auto transition-all duration-500 ${
                isAnimating ? "scale-105" : "scale-100"
              }`}
            >
              {/* Glass Panels with Reflections */}
              <div
                className={`absolute inset-0 rounded-t-lg border-4 ${
                  isDarkMode
                    ? "border-blue-400 bg-gradient-to-br from-blue-900/30 to-slate-900/50"
                    : "border-blue-600 bg-gradient-to-br from-blue-100/50 to-white/30"
                } backdrop-blur-sm`}
              >
                {/* Glass Reflection Effect */}
                <div
                  className={`absolute top-4 left-4 w-16 h-32 rounded-lg opacity-30 ${
                    isDarkMode ? "bg-white" : "bg-blue-200"
                  } transform rotate-12`}
                />
                <div
                  className={`absolute top-8 right-6 w-8 h-20 rounded-lg opacity-20 ${
                    isDarkMode ? "bg-cyan-300" : "bg-blue-300"
                  } transform -rotate-6`}
                />
              </div>

              {/* Animated Lighting */}
              <div
                className={`absolute -inset-2 rounded-t-lg opacity-50 animate-pulse ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20"
                    : "bg-gradient-to-r from-blue-300/30 via-cyan-200/30 to-blue-300/30"
                }`}
              />

              {/* Booth Interior */}
              <div className="absolute inset-4 flex flex-col items-center justify-center space-y-4">
                {/* Erigga's Avatar/Poster */}
                <div
                  className={`w-24 h-24 rounded-full border-4 ${
                    isDarkMode ? "border-blue-400" : "border-blue-600"
                  } overflow-hidden`}
                >
                  <img src="/images/hero/erigga1.jpeg" alt="Erigga" className="w-full h-full object-cover" />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      paymentSuccess ? "bg-green-400" : "bg-yellow-400"
                    }`}
                  />
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {paymentSuccess ? "Ready to Connect" : "Waiting for Payment"}
                  </span>
                </div>

                {/* Connection Animation */}
                {paymentSuccess && (
                  <div className="flex space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? "bg-green-400" : "bg-green-600"}`}
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? "bg-green-400" : "bg-green-600"}`}
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? "bg-green-400" : "bg-green-600"}`}
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </div>

              {/* Booth Base */}
              <div
                className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 rounded-full ${
                  isDarkMode
                    ? "bg-gradient-to-r from-slate-700 to-slate-600"
                    : "bg-gradient-to-r from-slate-300 to-slate-400"
                } shadow-lg`}
              />

              {/* Power Lines */}
              <div
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-1 h-8 ${
                  isDarkMode ? "bg-yellow-400" : "bg-yellow-600"
                }`}
              />
              <div
                className={`absolute -top-12 left-1/2 transform -translate-x-1/2 w-8 h-1 ${
                  isDarkMode ? "bg-yellow-400" : "bg-yellow-600"
                }`}
              />
            </div>

            {/* Electrical Effects */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <Zap className={`h-6 w-6 animate-pulse ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`} />
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card
            className={`${
              isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
            } backdrop-blur-sm`}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Clock className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    20 Minutes Exclusive Session
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    ₦100,000
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>

                <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"} space-y-2`}>
                  <p>✓ Direct video call with Erigga</p>
                  <p>✓ 20-minute guaranteed session</p>
                  <p>✓ High-quality video and audio</p>
                  <p>✓ Secure payment via Paystack</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="text-center">
          {!paymentSuccess ? (
            <Button
              onClick={() => setShowPaymentModal(true)}
              size="lg"
              className={`px-8 py-4 text-lg font-semibold transition-all duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <Phone className="mr-2 h-5 w-5" />
              Book Your Call - ₦100,000
            </Button>
          ) : (
            <Button
              onClick={() => setSessionActive(true)}
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Video className="mr-2 h-5 w-5" />
              Enter the Booth
            </Button>
          )}
        </div>

        {/* Payment Success Message */}
        {paymentSuccess && (
          <div className="text-center mt-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                isDarkMode
                  ? "bg-green-900/30 text-green-400 border border-green-700"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Payment successful! You can now enter the booth.
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          amount={100000}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}
