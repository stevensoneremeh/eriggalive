"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Video, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const MEET_GREET_PRICE = parseFloat(process.env.NEXT_PUBLIC_MEETGREET_PRICE || "50000")

export default function MeetAndGreetPage() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<"booking" | "payment" | "confirmation" | "call">("booking")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    booking_date: "",
    booking_time: "",
    user_name: "",
    notes: "",
  })
  const [booking, setBooking] = useState<any>(null)
  const [paymentUrl, setPaymentUrl] = useState("")
  const [dailyRoomUrl, setDailyRoomUrl] = useState("")

  const timeSlots = [
    "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM",
    "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
  ]

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const reference = urlParams.get("reference")
    
    if (reference) {
      verifyPayment(reference)
    }
  }, [])

  const handleBooking = async () => {
    if (!formData.booking_date || !formData.booking_time || !formData.user_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const bookingDateTime = new Date(`${formData.booking_date}T${convertTo24Hour(formData.booking_time)}`)
      
      const response = await fetch("/api/meet-greet/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: bookingDateTime.toISOString(),
          user_name: formData.user_name,
          notes: formData.notes,
          amount: MEET_GREET_PRICE,
        }),
      })

      if (!response.ok) throw new Error("Booking failed")
      
      const data = await response.json()
      setBooking(data.booking)
      setPaymentUrl(data.payment_url)
      
      // Redirect to Paystack payment
      window.location.href = data.payment_url
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPayment = async (reference: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/meet-greet/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })

      if (!response.ok) throw new Error("Verification failed")
      
      const data = await response.json()
      
      if (data.verified) {
        setBooking(data.booking)
        setDailyRoomUrl(data.booking.daily_room_url)
        setCurrentStep("confirmation")
        toast.success("Payment verified! Your booking is confirmed.")
      } else {
        toast.error("Payment verification failed")
        setCurrentStep("booking")
      }
    } catch (error: any) {
      toast.error(error.message || "Verification error")
      setCurrentStep("booking")
    } finally {
      setIsLoading(false)
    }
  }

  const convertTo24Hour = (time: string) => {
    const [timePart, period] = time.split(" ")
    let [hours, minutes] = timePart.split(":").map(Number)
    
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
  }

  const BookingForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-blue-100">Book Meet & Greet</h2>
          <p className="text-center text-sm text-blue-200 mb-6">₦{MEET_GREET_PRICE.toLocaleString()}</p>

          <div className="space-y-4">
            <div>
              <Label className="text-blue-200">Your Name</Label>
              <Input
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <Label className="text-blue-200">Select Date</Label>
              <select
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="" className="text-gray-800">Choose a date</option>
                {getAvailableDates().map((date) => (
                  <option key={date} value={date} className="text-gray-800">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-blue-200">Select Time</Label>
              <select
                value={formData.booking_time}
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="" className="text-gray-800">Choose a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time} className="text-gray-800">{time}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-blue-200">Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Any special requests?"
                rows={3}
              />
            </div>

            <Button
              onClick={handleBooking}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ConfirmationScreen = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-4 text-blue-100">Booking Confirmed!</h2>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-blue-200 mb-2">Your session is scheduled for:</p>
            <p className="font-semibold text-lg">
              {booking && new Date(booking.booking_date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="text-sm text-blue-200 mb-6 space-y-2">
            <p>• Ensure stable internet connection</p>
            <p>• Test camera and microphone</p>
            <p>• Join 5 minutes early</p>
            <p>• Be respectful and enjoy!</p>
          </div>

          {dailyRoomUrl && (
            <Button
              onClick={() => window.open(dailyRoomUrl, "_blank")}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Video className="mr-2 h-4 w-4" />
              Join Video Call
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <AuthGuard>
      <div className="min-h-screen w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-300 to-white">
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
                  repeat: Infinity,
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

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-b from-blue-100/30 to-blue-200/30 backdrop-blur-sm rounded-3xl p-8 border-4 border-white/30 shadow-2xl min-h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl border-2 border-white/20 m-2"></div>

              <AnimatePresence mode="wait">
                {currentStep === "booking" && <BookingForm key="booking" />}
                {currentStep === "confirmation" && <ConfirmationScreen key="confirmation" />}
              </AnimatePresence>
            </div>

            <motion.div
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
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
