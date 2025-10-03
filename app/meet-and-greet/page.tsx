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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Video, CheckCircle, Loader2, Phone, Clock } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const MEET_GREET_PRICE = parseFloat(process.env.NEXT_PUBLIC_MEETGREET_PRICE || "50000")

export default function MeetAndGreetPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState<"booking" | "payment" | "confirmation">("booking")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    scheduled_at: "",
    duration: "30",
    user_name: "",
    notes: "",
  })
  const [booking, setBooking] = useState<any>(null)
  const [roomUrl, setRoomUrl] = useState("")

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
  ]

  const durationOptions = [
    { value: "15", label: "15 minutes - ₦25,000" },
    { value: "30", label: "30 minutes - ₦50,000" },
    { value: "60", label: "60 minutes - ₦100,000" },
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

  const getPriceForDuration = (duration: string) => {
    const prices: { [key: string]: number } = {
      "15": 25000,
      "30": 50000,
      "60": 100000,
    }
    return prices[duration] || 50000
  }

  useEffect(() => {
    // Check for existing bookings
    if (user && profile) {
      checkExistingBookings()
    }
  }, [user, profile])

  const checkExistingBookings = async () => {
    const { data } = await supabase
      .from("meet_greet_bookings")
      .select("*")
      .eq("user_id", profile?.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setBooking(data)
      if (data.daily_room_url) {
        setRoomUrl(data.daily_room_url)
      }
      setCurrentStep("confirmation")
    }
  }

  const handleBooking = async () => {
    if (!formData.scheduled_at || !formData.user_name || !user || !profile) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const [date, time] = formData.scheduled_at.split('T')
      const scheduledDateTime = new Date(`${date}T${time}:00`)
      const amount = getPriceForDuration(formData.duration)
      
      // Initialize Paystack payment
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!paystackKey) {
        throw new Error("Payment system not configured")
      }

      const reference = `meetgreet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create booking record first
      const { data: bookingData, error: bookingError } = await supabase
        .from("meet_greet_bookings")
        .insert({
          user_id: profile.id,
          scheduled_at: scheduledDateTime.toISOString(),
          duration: parseInt(formData.duration),
          amount: amount,
          payment_reference: reference,
          payment_status: "pending",
          status: "pending",
          notes: formData.notes,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Load Paystack
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      document.body.appendChild(script)

      script.onload = () => {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: user.email,
          amount: amount * 100,
          currency: "NGN",
          ref: reference,
          metadata: {
            booking_id: bookingData.id,
            user_id: profile.id,
            duration: formData.duration,
          },
          callback: async (response: any) => {
            // Update booking as paid
            const { error } = await supabase
              .from("meet_greet_bookings")
              .update({
                payment_status: "completed",
                status: "scheduled",
              })
              .eq("id", bookingData.id)

            if (!error) {
              setBooking(bookingData)
              setCurrentStep("confirmation")
              toast.success("Booking confirmed! Admin will start the call at scheduled time.")
            }
          },
          onClose: () => {
            setIsLoading(false)
          },
        })
        handler.openIframe()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking")
      setIsLoading(false)
    }
  }

  const BookingForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-blue-100">Book Video Call with Erigga</h2>
          
          <div className="space-y-4 mt-6">
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
              <Label className="text-blue-200">Session Duration</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-blue-200">Select Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formData.scheduled_at.split('T')[0] || ""}
                  onChange={(e) => {
                    const time = formData.scheduled_at.split('T')[1] || "09:00"
                    setFormData({ ...formData, scheduled_at: `${e.target.value}T${time}` })
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="">Date</option>
                  {getAvailableDates().map((date) => (
                    <option key={date} value={date} className="text-gray-800">
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </option>
                  ))}
                </select>
                
                <select
                  value={formData.scheduled_at.split('T')[1] || ""}
                  onChange={(e) => {
                    const date = formData.scheduled_at.split('T')[0] || getAvailableDates()[0]
                    setFormData({ ...formData, scheduled_at: `${date}T${e.target.value}` })
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="">Time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="text-gray-800">
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-blue-200">Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="What would you like to discuss?"
                rows={3}
              />
            </div>

            <div className="bg-blue-500/20 p-3 rounded-lg">
              <p className="text-sm text-blue-200">
                <Clock className="inline w-4 h-4 mr-1" />
                Admin will start the call at your scheduled time
              </p>
            </div>

            <Button
              onClick={handleBooking}
              disabled={isLoading || !formData.scheduled_at || !formData.user_name}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
              Book for ₦{getPriceForDuration(formData.duration).toLocaleString()}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ConfirmationScreen = () => {
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
      if (booking) {
        // Poll for room URL updates
        const interval = setInterval(async () => {
          const { data } = await supabase
            .from("meet_greet_bookings")
            .select("daily_room_url, status")
            .eq("id", booking.id)
            .single()

          if (data?.daily_room_url) {
            setRoomUrl(data.daily_room_url)
            if (data.status === "in_progress") {
              clearInterval(interval)
            }
          }
        }, 5000)

        setPollInterval(interval)
        return () => clearInterval(interval)
      }
    }, [booking])

    return (
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
                {booking && new Date(booking.scheduled_at).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-blue-300 mt-2">Duration: {booking?.duration} minutes</p>
            </div>

            {!roomUrl && (
              <div className="bg-yellow-500/20 p-3 rounded-lg mb-6">
                <p className="text-sm text-yellow-200">
                  <Loader2 className="inline w-4 h-4 mr-1 animate-spin" />
                  Waiting for admin to start the call...
                </p>
              </div>
            )}

            {roomUrl && (
              <div className="mb-6">
                <Button
                  onClick={() => window.open(roomUrl, "_blank")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Join Video Call Now
                </Button>
              </div>
            )}

            <div className="text-sm text-blue-200 space-y-2">
              <p>• Ensure stable internet connection</p>
              <p>• Test camera and microphone</p>
              <p>• Be ready at scheduled time</p>
              <p>• Be respectful and enjoy!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

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
