"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Video, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface BookingData {
  date: string
  time: string
}

export default function MeetAndGreetPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<"booking" | "payment" | "confirmation" | "call">("booking")
  const [bookingData, setBookingData] = useState<BookingData>({ date: "", time: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [callRoom, setCallRoom] = useState<string | null>(null)

  // Generate available time slots
  const timeSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
  ]

  // Get next 30 days for date selection
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split("T")[0])
    }
    return dates
  }

  const handleBegin = async () => {
    if (!bookingData.date || !bookingData.time) {
      toast({
        title: "Please select date and time",
        description: "Both date and time are required to proceed.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setCurrentStep("payment")

    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep("confirmation")
      // Generate unique room ID
      setCallRoom(`erigga-meetgreet-${Date.now()}`)
    }, 2000)
  }

  const handleJoinCall = () => {
    setCurrentStep("call")
    // In a real implementation, this would integrate with Daily.co
    toast({
      title: "Joining call...",
      description: "Connecting you to the video call room.",
    })
  }

  const BookingForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-blue-100">Book Your Session</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-blue-200">Select Date</label>
              <select
                value={bookingData.date}
                onChange={(e) => setBookingData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="text-gray-800">
                  Choose a date
                </option>
                {getAvailableDates().map((date) => (
                  <option key={date} value={date} className="text-gray-800">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-blue-200">Select Time</label>
              <select
                value={bookingData.time}
                onChange={(e) => setBookingData((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="text-gray-800">
                  Choose a time
                </option>
                {timeSlots.map((time) => (
                  <option key={time} value={time} className="text-gray-800">
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleBegin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Begin
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const PaymentScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-6 text-blue-100">Processing Payment</h2>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-blue-200">Connecting to Paystack...</p>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ConfirmationScreen = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-4 text-blue-100">Booking Confirmed!</h2>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-blue-200 mb-2">Your session is scheduled for:</p>
            <p className="font-semibold text-lg">
              {new Date(bookingData.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {bookingData.time}
            </p>
          </div>

          <div className="text-sm text-blue-200 mb-6 space-y-2">
            <p>• Ensure you have a stable internet connection</p>
            <p>• Test your camera and microphone beforehand</p>
            <p>• Join the call 5 minutes early</p>
            <p>• Be respectful and enjoy the experience</p>
          </div>

          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.5)",
                "0 0 40px rgba(59, 130, 246, 0.8)",
                "0 0 20px rgba(59, 130, 246, 0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Button
              onClick={handleJoinCall}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              <Video className="w-5 h-5 mr-2" />
              Join Call
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const CallScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white w-full max-w-4xl h-96">
        <CardContent className="p-8 h-full flex flex-col items-center justify-center">
          <Video className="w-24 h-24 text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-blue-100">Video Call Room</h2>
          <p className="text-blue-200 mb-4">Room ID: {callRoom}</p>
          <p className="text-sm text-blue-300 text-center">
            In a real implementation, this would embed the Daily.co video call interface.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <AuthGuard>
      <div className="min-h-screen w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-300 to-white">
          {/* Desert background with animated particles */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                animate={{
                  x: [0, Math.random() * 100, 0],
                  y: [0, Math.random() * 100, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Phone booth container */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Phone booth structure */}
            <div className="relative bg-gradient-to-b from-blue-100/30 to-blue-200/30 backdrop-blur-sm rounded-3xl p-8 border-4 border-white/30 shadow-2xl min-h-[600px] flex items-center justify-center">
              {/* Booth frame decoration */}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/20 m-2"></div>

              {/* Content based on current step */}
              <AnimatePresence mode="wait">
                {currentStep === "booking" && <BookingForm key="booking" />}
                {currentStep === "payment" && <PaymentScreen key="payment" />}
                {currentStep === "confirmation" && <ConfirmationScreen key="confirmation" />}
                {currentStep === "call" && <CallScreen key="call" />}
              </AnimatePresence>
            </div>

            {/* Booth base glow effect */}
            <motion.div
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-blue-400/30 rounded-full blur-xl"
            />
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
