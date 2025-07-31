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
        {/* 3D Phone Booth Background - Always visible */}
        <div className="absolute inset-0 z-0">
          <PhoneBoothScene />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {currentStep === "booking" && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full max-w-md"
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
                className="w-full max-w-md"
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
                className="w-full max-w-lg"
              >
                <ConfirmationScreen bookingData={bookingData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ambient particles for atmosphere */}
        <div className="absolute inset-0 z-5 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </AuthGuard>
  )
}
