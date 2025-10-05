"use client"

<<<<<<< HEAD
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Video, Clock, CalendarIcon, Coins, Star, CheckCircle, Users, Crown, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

interface MeetPackage {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number // in coins
  features: string[]
  type: "video" | "audio" | "group"
  max_participants?: number
  icon: React.ReactNode
  popular?: boolean
}

interface BookingForm {
  package_id: string
  preferred_date: Date | undefined
  preferred_time: string
  message: string
  participants: number
}

export default function MeetAndGreetPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState<MeetPackage | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    package_id: "",
    preferred_date: undefined,
    preferred_time: "",
    message: "",
    participants: 1,
  })
  const [isBooking, setIsBooking] = useState(false)
  const [bookingStep, setBookingStep] = useState<"select" | "details" | "payment" | "confirmation">("select")
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  const packages: MeetPackage[] = [
    {
      id: "video-solo",
      name: "Solo Video Call",
      description: "One-on-one video call with Erigga",
      duration: 15,
      price: 5000,
      features: [
        "15-minute private video call",
        "Personal conversation",
        "Photo opportunity (screenshot)",
        "Exclusive access",
        "Recording available",
      ],
      type: "video",
      icon: <Video className="w-6 h-6" />,
      popular: true,
    },
    {
      id: "audio-solo",
      name: "Solo Audio Call",
      description: "Personal phone call with Erigga",
      duration: 20,
      price: 3000,
      features: [
        "20-minute private audio call",
        "Personal conversation",
        "Exclusive access",
        "Recording available",
        "More intimate setting",
      ],
      type: "audio",
      icon: <Phone className="w-6 h-6" />,
    },
    {
      id: "group-video",
      name: "Group Video Session",
      description: "Group video call with other fans",
      duration: 30,
      price: 2000,
      features: [
        "30-minute group video call",
        "Up to 10 participants",
        "Q&A session",
        "Group photo opportunity",
        "Community interaction",
      ],
      type: "group",
      max_participants: 10,
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: "premium-video",
      name: "Premium Experience",
      description: "Extended premium video session",
      duration: 45,
      price: 8000,
      features: [
        "45-minute premium video call",
        "Extended conversation time",
        "Personalized message",
        "Exclusive content preview",
        "Priority booking",
        "Digital autograph",
      ],
      type: "video",
      icon: <Crown className="w-6 h-6" />,
    },
  ]

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ]

  const handlePackageSelect = (pkg: MeetPackage) => {
    setSelectedPackage(pkg)
    setBookingForm((prev) => ({ ...prev, package_id: pkg.id }))
    setBookingStep("details")
  }

  const handleBookingSubmit = async () => {
    if (!selectedPackage || !profile || !bookingForm.preferred_date || !bookingForm.preferred_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < selectedPackage.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${selectedPackage.price} coins but only have ${profile.coins}.`,
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)

    try {
      // Deduct coins
      const newCoins = profile.coins - selectedPackage.price

      const { error: updateError } = await supabase.from("users").update({ coins: newCoins }).eq("id", profile.id)

      if (updateError) throw updateError

      // Create booking record (you would have a bookings table)
      const bookingData = {
        user_id: profile.id,
        package_id: selectedPackage.id,
        preferred_date: bookingForm.preferred_date.toISOString(),
        preferred_time: bookingForm.preferred_time,
        message: bookingForm.message,
        participants: bookingForm.participants,
        status: "pending",
        coins_paid: selectedPackage.price,
      }

      // In a real app, you would insert this into a bookings table
      // const { data: booking, error: bookingError } = await supabase
      //   .from("bookings")
      //   .insert(bookingData)
      //   .select()
      //   .single()

      // For demo purposes, create a mock booking confirmation
      const mockBooking = {
        id: `booking-${Date.now()}`,
        ...bookingData,
        booking_reference: `EL${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString(),
      }

      setBookingConfirmation(mockBooking)
      await refreshProfile()
      setBookingStep("confirmation")

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your ${selectedPackage.name} has been booked successfully!`,
      })
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  const resetBooking = () => {
    setSelectedPackage(null)
    setBookingForm({
      package_id: "",
      preferred_date: undefined,
      preferred_time: "",
      message: "",
      participants: 1,
    })
    setBookingStep("select")
    setBookingConfirmation(null)
=======
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
>>>>>>> new
  }

  return (
    <AuthGuard>
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meet & Greet</h1>
                <p className="text-gray-600 dark:text-gray-300">Book a personal session with Erigga</p>
              </div>
            </div>

            {/* User Coins Display */}
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Balance</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile?.coins?.toLocaleString() || 0} coins
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Buy More Coins
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Flow */}
          {bookingStep === "select" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Experience</h2>
                <p className="text-gray-600 dark:text-gray-300">Select the perfect meet & greet package for you</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                      pkg.popular ? "ring-2 ring-purple-500" : ""
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        {pkg.icon}
                      </div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription className="text-sm">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {pkg.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                          <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                          coins
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {pkg.duration}min
                        </div>
                        {pkg.max_participants && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Max {pkg.max_participants}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={profile?.coins < pkg.price}
                      >
                        {profile?.coins < pkg.price ? "Insufficient Coins" : "Select Package"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {bookingStep === "details" && selectedPackage && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Details</h2>
                <p className="text-gray-600 dark:text-gray-300">Complete your {selectedPackage.name} booking</p>
              </div>

              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedPackage.icon}
                    <span className="ml-2">{selectedPackage.name}</span>
                    <Badge className="ml-auto">{selectedPackage.price.toLocaleString()} coins</Badge>
                  </CardTitle>
                  <CardDescription>{selectedPackage.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Preferred Date</Label>
                    <Calendar
                      mode="single"
                      selected={bookingForm.preferred_date}
                      onSelect={(date) => setBookingForm((prev) => ({ ...prev, preferred_date: date }))}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label>Preferred Time (WAT)</Label>
                    <Select
                      value={bookingForm.preferred_time}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, preferred_time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Participants (for group sessions) */}
                  {selectedPackage.type === "group" && (
                    <div className="space-y-2">
                      <Label>Number of Participants</Label>
                      <Select
                        value={bookingForm.participants.toString()}
                        onValueChange={(value) =>
                          setBookingForm((prev) => ({ ...prev, participants: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: selectedPackage.max_participants || 1 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} participant{num > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>Message (Optional)</Label>
                    <Textarea
                      placeholder="Any special requests or what you'd like to talk about..."
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setBookingStep("select")} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleBookingSubmit}
                      disabled={!bookingForm.preferred_date || !bookingForm.preferred_time || isBooking}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isBooking ? "Processing..." : `Pay ${selectedPackage.price.toLocaleString()} Coins`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {bookingStep === "confirmation" && bookingConfirmation && selectedPackage && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your meet & greet session has been successfully booked
                </p>
              </div>

              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-center">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedPackage.name}</div>
                    <div className="text-lg text-gray-600 dark:text-gray-400">
                      Reference: {bookingConfirmation.booking_reference}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CalendarIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="font-semibold">Date</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(bookingConfirmation.preferred_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="font-semibold">Time</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {bookingConfirmation.preferred_time} WAT
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What's Next?</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• You'll receive a confirmation email with meeting details</li>
                      <li>• A calendar invite will be sent 24 hours before the session</li>
                      <li>• Join the meeting using the link provided in the email</li>
                      <li>• Make sure you have a stable internet connection</li>
                    </ul>
                  </div>

                  {bookingConfirmation.message && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Your Message</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{bookingConfirmation.message}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={resetBooking} className="flex-1 bg-transparent">
                      Book Another Session
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Heart className="w-4 h-4 mr-2" />
                      Share Experience
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          {bookingStep === "select" && (
            <Card className="mt-12 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How do I join my session?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You'll receive an email with a meeting link 24 hours before your scheduled session. Simply click the
                    link at the scheduled time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I reschedule my booking?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, you can reschedule up to 48 hours before your session. Contact support for assistance.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What if I have technical issues?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our support team will be available during your session to help with any technical difficulties.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Are recordings available?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, most packages include a recording that will be sent to you within 24 hours after the session.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
=======
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
>>>>>>> new
        </div>
      </div>
    </AuthGuard>
  )
}
