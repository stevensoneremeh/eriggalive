"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { PhoneBoothScene } from "@/components/meet-and-greet/phone-booth-scene"
import { BookingForm } from "@/components/meet-and-greet/booking-form"
import { PaymentScreen } from "@/components/meet-and-greet/payment-screen"
import { ConfirmationScreen } from "@/components/meet-and-greet/confirmation-screen"

type Step = "booking" | "payment" | "confirmation"

interface BookingData {
  date: string
  time: string
  amount: number
}

export default function MeetAndGreetPage() {
  const [currentStep, setCurrentStep] = useState<Step>("booking")
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { user, profile } = useAuth()

  useEffect(() => {
    setIsLoaded(true)

    // Suppress ResizeObserver errors
    const resizeObserverErrorHandler = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    window.addEventListener("error", resizeObserverErrorHandler)

    return () => {
      window.removeEventListener("error", resizeObserverErrorHandler)
    }
  }, [])

  const handleBookingSubmit = (data: { date: string; time: string }) => {
    setBookingData({ ...data, amount: 5000 }) // ₦5,000 for Meet & Greet
    setCurrentStep("payment")
  }

  const handlePaymentSuccess = () => {
    setCurrentStep("confirmation")
  }

  const handleBackToBooking = () => {
    setCurrentStep("booking")
    setBookingData(null)
  }

  if (!isLoaded) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-50 flex items-center justify-center">
          <div className="text-blue-600 text-lg">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-50 relative overflow-hidden">
        {/* Improved Layout: Phone Booth and Content Side by Side */}
        <div className="flex flex-col xl:flex-row min-h-screen">
          {/* 3D Phone Booth Section */}
          <div className="xl:w-3/5 h-80 xl:h-screen relative">
            <PhoneBoothScene />

            {/* Overlay Title for Mobile/Tablet */}
            <div className="absolute top-4 left-4 right-4 xl:hidden">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center shadow-lg"
              >
                <h1 className="text-2xl font-bold text-gray-800">Meet & Greet Experience</h1>
                <p className="text-gray-600 text-sm mt-1">Step into the virtual phone booth</p>
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="xl:w-2/5 flex items-center justify-center p-4 lg:p-8 relative z-10 bg-white/10 backdrop-blur-sm">
            <div className="w-full max-w-lg">
              {/* Desktop Title */}
              <div className="hidden xl:block mb-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20"
                >
                  <h1 className="text-4xl font-bold text-gray-800 mb-3">Meet & Greet Experience</h1>
                  <p className="text-gray-600 text-lg">Book your exclusive session with Erigga</p>
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600 font-medium">Virtual Experience Available</span>
                  </div>
                </motion.div>
              </div>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                {currentStep === "booking" && (
                  <motion.div
                    key="booking"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20"
                  >
                    <BookingForm onSubmit={handleBookingSubmit} />
                  </motion.div>
                )}

                {currentStep === "payment" && bookingData && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20"
                  >
                    <PaymentScreen
                      bookingData={bookingData}
                      user={user}
                      profile={profile}
                      onSuccess={handlePaymentSuccess}
                      onBack={handleBackToBooking}
                    />
                  </motion.div>
                )}

                {currentStep === "confirmation" && bookingData && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20"
                  >
                    <ConfirmationScreen bookingData={bookingData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Ambient particles for atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-3 bg-white/20 backdrop-blur-sm rounded-full p-2">
            {["booking", "payment", "confirmation"].map((step, index) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? "bg-blue-500 scale-125 shadow-lg"
                    : index < ["booking", "payment", "confirmation"].indexOf(currentStep)
                      ? "bg-green-500 shadow-md"
                      : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl"></div>
      </div>
    </AuthGuard>
  )
}
